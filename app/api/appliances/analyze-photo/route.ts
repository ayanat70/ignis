import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeApplianceLabel, validateBase64File } from "@/lib/gemini";

const analyzePhotoSchema = z.object({
  imageBase64: z.string().min(1, "Поле imageBase64 обязательно"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = analyzePhotoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Невалидные входные данные",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const fileValidation = validateBase64File(parsed.data.imageBase64);
    if (!fileValidation.valid) {
      return NextResponse.json(
        { error: fileValidation.error || "Недопустимый файл" },
        { status: 400 }
      );
    }

    const data = await analyzeApplianceLabel(parsed.data.imageBase64);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("POST /api/appliances/analyze-photo error:", error);
    return NextResponse.json(
      {
        error:
          error?.message ||
          "Не удалось распознать данные с фото, попробуйте более чёткое изображение или введите данные вручную",
      },
      { status: 400 }
    );
  }
}
