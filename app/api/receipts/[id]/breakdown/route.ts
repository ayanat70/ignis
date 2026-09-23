import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: receiptId } = params;

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        estimates: {
          include: {
            appliance: true,
          },
          orderBy: {
            calibratedKwh: "desc",
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { error: `Квитанция с ID "${receiptId}" не найдена` },
        { status: 404 }
      );
    }

    const totalCalibratedKwh = receipt.estimates.reduce(
      (sum, est) => sum + (est.calibratedKwh ?? 0),
      0
    );

    return NextResponse.json({
      receipt,
      estimates: receipt.estimates,
      totalCalibratedKwh,
      differenceWithActualKwh: Math.abs(receipt.totalKwh - totalCalibratedKwh),
    });
  } catch (error: any) {
    console.error("GET /api/receipts/[id]/breakdown error:", error);
    return NextResponse.json(
      { error: error?.message || "Ошибка при получении декомпозиции счёта" },
      { status: 500 }
    );
  }
}
