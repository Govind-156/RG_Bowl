import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const updateSettingsSchema = z.object({
  operatingHours: z.string().min(1).optional(),
  isOrderingPaused: z.boolean().optional(),
  pauseReason: z.string().nullable().optional(),
});

async function getOrCreateSettings() {
  const existing = await prisma.settings.findUnique({
    where: { id: 1 },
  });

  if (existing) return existing;

  return prisma.settings.create({
    data: {
      id: 1,
      operatingHours: "19:00-03:00",
      isOrderingPaused: false,
    },
  });
}

export async function GET() {
  const settings = await getOrCreateSettings();
  return NextResponse.json(settings, { status: 200 });
}

export async function PATCH(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = updateSettingsSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const updated = await prisma.settings.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        operatingHours: data.operatingHours ?? "19:00-03:00",
        isOrderingPaused: data.isOrderingPaused ?? false,
        pauseReason: data.pauseReason ?? null,
      },
      update: {
        operatingHours: data.operatingHours ?? undefined,
        isOrderingPaused: data.isOrderingPaused ?? undefined,
        pauseReason: data.pauseReason ?? undefined,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("Error updating settings", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

