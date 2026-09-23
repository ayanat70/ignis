import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeReceipt } from "@/lib/gemini";

const analyzeReceiptPhotoSchema = z.object({
  imageBase64: z.string().min(1, "Поле imageBase64 обязательно"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = analyzeReceiptPhotoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Невалидные входные данные",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = await analyzeReceipt(parsed.data.imageBase64);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("POST /api/receipts/analyze-photo error:", error);
    return NextResponse.json(
      { error: error?.message || "Ошибка при анализе фото квитанции" },
      { status: 500 }
    );
  }
}
