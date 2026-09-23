import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getOrCreateTestUser } from "@/lib/user";

const createReceiptSchema = z.object({
  periodMonth: z
    .number()
    .int("periodMonth должно быть целым числом")
    .min(1, "periodMonth должен быть от 1 до 12")
    .max(12, "periodMonth должен быть от 1 до 12"),
  periodYear: z
    .number()
    .int("periodYear должно быть целым числом")
    .min(2000, "periodYear должен быть не меньше 2000")
    .max(2100, "periodYear должен быть не больше 2100"),
  totalKwh: z
    .number()
    .positive("totalKwh должно быть положительным числом"),
  totalAmount: z
    .number()
    .nonnegative("totalAmount не может быть отрицательным"),
  tariffRate: z
    .number()
    .positive("tariffRate должен быть больше нуля")
    .nullable()
    .optional(),
  imageUrl: z.string().nullable().optional(),
  ocrRawData: z.any().optional(),
  calibrationCoef: z.number().nullable().optional(),
});

export async function GET() {
  try {
    const user = await getOrCreateTestUser();
    const receipts = await prisma.receipt.findMany({
      where: { userId: user.id },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      include: {
        estimates: true,
      },
    });

    return NextResponse.json(receipts);
  } catch (error: any) {
    console.error("GET /api/receipts error:", error);
    return NextResponse.json(
      { error: error?.message || "Ошибка при получении квитанций" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createReceiptSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Невалидные входные данные",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const user = await getOrCreateTestUser();
    const {
      periodMonth,
      periodYear,
      totalKwh,
      totalAmount,
      tariffRate,
      imageUrl,
      ocrRawData,
      calibrationCoef,
    } = parsed.data;

    const receipt = await prisma.receipt.upsert({
      where: {
        userId_periodMonth_periodYear: {
          userId: user.id,
          periodMonth,
          periodYear,
        },
      },
      update: {
        totalKwh,
        totalAmount,
        tariffRate: tariffRate !== undefined ? tariffRate : null,
        imageUrl: imageUrl || null,
        ocrRawData: ocrRawData ?? undefined,
        calibrationCoef: calibrationCoef !== undefined ? calibrationCoef : null,
      },
      create: {
        userId: user.id,
        periodMonth,
        periodYear,
        totalKwh,
        totalAmount,
        tariffRate: tariffRate !== undefined ? tariffRate : null,
        imageUrl: imageUrl || null,
        ocrRawData: ocrRawData ?? undefined,
        calibrationCoef: calibrationCoef !== undefined ? calibrationCoef : null,
      },
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/receipts error:", error);
    return NextResponse.json(
      { error: error?.message || "Ошибка при сохранении квитанции" },
      { status: 500 }
    );
  }
}
