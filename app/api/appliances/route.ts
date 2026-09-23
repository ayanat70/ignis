import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getOrCreateTestUser } from "@/lib/user";

const createApplianceSchema = z.object({
  name: z.string().trim().min(1, "Поле 'name' обязательно для заполнения"),
  brand: z.string().trim().nullable().optional(),
  model: z.string().trim().nullable().optional(),
  category: z.string().trim().nullable().optional(),
  ratedPowerWatts: z
    .number()
    .positive("Мощность ratedPowerWatts должна быть больше нуля"),
  source: z.enum(["PHOTO_LABEL", "MODEL_NAME", "MANUAL"]).default("MANUAL"),
  imageUrl: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const user = await getOrCreateTestUser();
    const appliances = await prisma.appliance.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(appliances);
  } catch (error: any) {
    console.error("GET /api/appliances error:", error);
    return NextResponse.json(
      { error: error?.message || "Ошибка при получении списка приборов" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createApplianceSchema.safeParse(body);

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
    const { name, brand, model, category, ratedPowerWatts, source, imageUrl } =
      parsed.data;

    const appliance = await prisma.appliance.create({
      data: {
        userId: user.id,
        name,
        brand: brand || null,
        model: model || null,
        category: category || null,
        ratedPowerWatts,
        source,
        imageUrl: imageUrl || null,
      },
    });

    return NextResponse.json(appliance, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/appliances error:", error);
    return NextResponse.json(
      { error: error?.message || "Ошибка при сохранении прибора" },
      { status: 500 }
    );
  }
}
