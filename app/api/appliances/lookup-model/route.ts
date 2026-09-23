import { NextResponse } from "next/server";
import { z } from "zod";
import { lookupApplianceByModel } from "@/lib/gemini";

const lookupModelSchema = z.object({
  modelName: z.string().trim().min(1, "Поле modelName обязательно"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = lookupModelSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Невалидные входные данные",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = await lookupApplianceByModel(parsed.data.modelName);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("POST /api/appliances/lookup-model error:", error);
    return NextResponse.json(
      { error: error?.message || "Ошибка при поиске характеристик модели" },
      { status: 500 }
    );
  }
}
