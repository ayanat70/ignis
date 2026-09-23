import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import {
  calculateCalibrationCoefficient,
  calculatePriority,
  calculateRawEstimate,
  getDaysInPeriod,
} from "@/lib/calculations";

const calculateItemSchema = z.object({
  applianceId: z.string().trim().min(1, "applianceId обязателен"),
  hoursPerDay: z
    .number({ invalid_type_error: "hoursPerDay должно быть числом" })
    .min(0, "hoursPerDay не может быть меньше 0")
    .max(24, "hoursPerDay не может превышать 24"),
  dutyCycle: z
    .number({ invalid_type_error: "dutyCycle должно быть числом" })
    .min(0, "dutyCycle не может быть меньше 0")
    .max(1, "dutyCycle не может превышать 1")
    .default(1.0),
});

const calculatePayloadSchema = z
  .array(calculateItemSchema)
  .min(1, "Необходимо указать хотя бы один прибор для расчёта");

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: receiptId } = params;

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: `Квитанция с ID "${receiptId}" не найдена` },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = calculatePayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Невалидные входные данные",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const items = parsed.data;
    const applianceIds = items.map((i) => i.applianceId);

    const appliances = await prisma.appliance.findMany({
      where: { id: { in: applianceIds } },
    });

    const applianceMap = new Map(appliances.map((a) => [a.id, a]));
    const missingIds = applianceIds.filter((id) => !applianceMap.has(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: "Некоторые приборы не найдены в базе данных",
          missingIds,
        },
        { status: 400 }
      );
    }

    const daysInPeriod = getDaysInPeriod(receipt.periodYear, receipt.periodMonth);

    // 1. Calculate raw estimate for each appliance
    const rawEstimates = items.map((item) => {
      const appliance = applianceMap.get(item.applianceId)!;
      const rawEstimateKwh = calculateRawEstimate(
        appliance.ratedPowerWatts,
        item.hoursPerDay,
        item.dutyCycle,
        daysInPeriod
      );
      return {
        ...item,
        appliance,
        rawEstimateKwh,
      };
    });

    // 2. Sum of raw estimates & calibration coefficient
    const estimatesSum = rawEstimates.reduce(
      (sum, item) => sum + item.rawEstimateKwh,
      0
    );
    const calibrationCoef = calculateCalibrationCoefficient(
      receipt.totalKwh,
      estimatesSum
    );

    // 3. Calibrated kWh and priority
    const finalCalculations = rawEstimates.map((item) => {
      const calibratedKwh = item.rawEstimateKwh * calibrationCoef;
      const priority = calculatePriority(
        calibratedKwh,
        receipt.totalKwh,
        item.appliance.flexibility
      );
      return {
        ...item,
        calibratedKwh,
        priority,
      };
    });

    // 4. Save each ApplianceEstimate record
    const savedEstimates = [];
    for (const item of finalCalculations) {
      const estimate = await prisma.applianceEstimate.upsert({
        where: {
          applianceId_receiptId: {
            applianceId: item.applianceId,
            receiptId: receipt.id,
          },
        },
        update: {
          hoursPerDay: item.hoursPerDay,
          dutyCycle: item.dutyCycle,
          rawEstimateKwh: item.rawEstimateKwh,
          calibratedKwh: item.calibratedKwh,
          priority: item.priority,
        },
        create: {
          applianceId: item.applianceId,
          receiptId: receipt.id,
          hoursPerDay: item.hoursPerDay,
          dutyCycle: item.dutyCycle,
          rawEstimateKwh: item.rawEstimateKwh,
          calibratedKwh: item.calibratedKwh,
          priority: item.priority,
        },
        include: {
          appliance: true,
        },
      });
      savedEstimates.push(estimate);
    }

    // 5. Update receipt calibrationCoef
    const updatedReceipt = await prisma.receipt.update({
      where: { id: receipt.id },
      data: { calibrationCoef },
    });

    // Sort by calibratedKwh descending
    savedEstimates.sort(
      (a, b) => (b.calibratedKwh ?? 0) - (a.calibratedKwh ?? 0)
    );

    return NextResponse.json({
      receipt: updatedReceipt,
      estimates: savedEstimates,
    });
  } catch (error: any) {
    console.error("POST /api/receipts/[id]/calculate error:", error);
    return NextResponse.json(
      { error: error?.message || "Ошибка при выполнении расчёта энергоаудита" },
      { status: 500 }
    );
  }
}
