import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn(
    "Warning: GEMINI_API_KEY is not defined in environment variables."
  );
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export interface ApplianceLabelAnalysis {
  name: string;
  brand: string | null;
  model: string | null;
  ratedPowerWatts: number;
  confidence: number;
}

export interface ModelLookupResult {
  name: string;
  brand: string | null;
  ratedPowerWatts: number;
  confidence: number;
}

export interface ReceiptAnalysis {
  totalKwh: number;
  totalAmount: number;
  tariffRate: number | null;
  periodMonth: number;
  periodYear: number;
}

function parseBase64Image(imageBase64: string): {
  mimeType: string;
  data: string;
} {
  const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return { mimeType: match[1], data: match[2] };
  }
  return { mimeType: "image/jpeg", data: imageBase64 };
}

function cleanAndParseJSON<T>(rawText: string): T {
  try {
    return JSON.parse(rawText) as T;
  } catch {
    const stripped = rawText
      .replace(/```(?:json)?/gi, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(stripped) as T;
    } catch {
      const firstBrace = rawText.indexOf("{");
      const lastBrace = rawText.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        return JSON.parse(rawText.substring(firstBrace, lastBrace + 1)) as T;
      }
      throw new Error(`Failed to parse JSON from Gemini response: ${rawText}`);
    }
  }
}

/**
 * Extracts appliance name, brand, model, and rated power in watts from a nameplate / label photo.
 */
export async function analyzeApplianceLabel(
  imageBase64: string
): Promise<ApplianceLabelAnalysis> {
  try {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in environment variables");
    }

    const { mimeType, data } = parseBase64Image(imageBase64);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are an expert electrical engineer and energy auditor analyzing an appliance nameplate/label photo.
Examine this nameplate image carefully and extract:
- "name": general name/type of appliance (e.g. "Холодильник", "Стиральная машина", "Кондиционер", "Электрочайник") in Russian
- "brand": manufacturer brand name (or null if not found)
- "model": specific model code/number (or null if not found)
- "ratedPowerWatts": rated electrical power consumption in Watts (W / Вт). If given in kW, convert to Watts (e.g. 1.5 kW = 1500). If only voltage and current are specified (e.g. 230V, 10A), estimate P = V * I. Must be a positive number.
- "confidence": confidence score from 0.0 to 1.0 (e.g. 0.95)

Return STRICTLY a JSON object matching this schema:
{
  "name": string,
  "brand": string | null,
  "model": string | null,
  "ratedPowerWatts": number,
  "confidence": number
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data,
        },
      },
    ]);

    const responseText = result.response.text();
    const parsed = cleanAndParseJSON<ApplianceLabelAnalysis>(responseText);

    return {
      name: String(parsed.name || "Электроприбор"),
      brand: parsed.brand ? String(parsed.brand) : null,
      model: parsed.model ? String(parsed.model) : null,
      ratedPowerWatts: Number(parsed.ratedPowerWatts) || 0,
      confidence: Math.min(
        1.0,
        Math.max(0.0, Number(parsed.confidence) || 0.5)
      ),
    };
  } catch (error: any) {
    throw new Error(`analyzeApplianceLabel error: ${error?.message || error}`);
  }
}

/**
 * Looks up typical/rated power in watts and details for an appliance by model or name.
 */
export async function lookupApplianceByModel(
  modelName: string
): Promise<ModelLookupResult> {
  try {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in environment variables");
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `You are a database of electrical appliances and specifications.
Look up or estimate technical specifications for the appliance specified by the model or query: "${modelName}".
Determine:
- "name": general name/type of appliance in Russian (e.g. "Холодильник", "Кондиционер", "Телевизор", "СВЧ-печь")
- "brand": brand/manufacturer (or null if unknown)
- "ratedPowerWatts": typical rated power consumption in Watts (W) for this model or class of device. Must be a number.
- "confidence": confidence in this estimate from 0.0 to 1.0

Return STRICTLY a JSON object with this schema:
{
  "name": string,
  "brand": string | null,
  "ratedPowerWatts": number,
  "confidence": number
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = cleanAndParseJSON<ModelLookupResult>(responseText);

    return {
      name: String(parsed.name || modelName),
      brand: parsed.brand ? String(parsed.brand) : null,
      ratedPowerWatts: Number(parsed.ratedPowerWatts) || 100,
      confidence: Math.min(
        1.0,
        Math.max(0.0, Number(parsed.confidence) || 0.5)
      ),
    };
  } catch (error: any) {
    throw new Error(`lookupApplianceByModel error: ${error?.message || error}`);
  }
}

/**
 * Extracts billing period, total kWh, and total cost from a utility receipt / bill photo.
 */
export async function analyzeReceipt(
  imageBase64: string
): Promise<ReceiptAnalysis> {
  try {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in environment variables");
    }

    const { mimeType, data } = parseBase64Image(imageBase64);
    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const currentYear = new Date().getFullYear();
    const prompt = `You are an expert OCR utility bill parser analyzing an electricity/utility bill photo.
Examine this receipt carefully and extract:
- "totalKwh": total electricity consumption in kWh (кВт·ч / расход электроэнергии). Number.
- "totalAmount": total amount due / payable in the currency of the receipt (Итого к оплате / Сумма). Number.
- "tariffRate": cost per 1 kWh if mentioned, otherwise calculate totalAmount / totalKwh or return null. Number or null.
- "periodMonth": billing period month (integer from 1 to 12). If unclear, estimate current or previous month.
- "periodYear": billing period year (4-digit integer, e.g. ${currentYear}).

Return STRICTLY a JSON object with this schema:
{
  "totalKwh": number,
  "totalAmount": number,
  "tariffRate": number | null,
  "periodMonth": number,
  "periodYear": number
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType,
          data,
        },
      },
    ]);

    const responseText = result.response.text();
    const parsed = cleanAndParseJSON<ReceiptAnalysis>(responseText);

    return {
      totalKwh: Number(parsed.totalKwh) || 0,
      totalAmount: Number(parsed.totalAmount) || 0,
      tariffRate:
        parsed.tariffRate !== null && parsed.tariffRate !== undefined
          ? Number(parsed.tariffRate)
          : null,
      periodMonth: Math.min(
        12,
        Math.max(1, Math.round(Number(parsed.periodMonth)) || 1)
      ),
      periodYear: Math.round(Number(parsed.periodYear)) || currentYear,
    };
  } catch (error: any) {
    throw new Error(`analyzeReceipt error: ${error?.message || error}`);
  }
}
