import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helpers";
import { z } from "zod";

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "Invalid id"),
});

const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  isAvailable: z.boolean().optional(),
  isServable: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const paramsParse = idParamSchema.safeParse(resolvedParams);
    if (!paramsParse.success) {
      return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
    }

    const json = await request.json();
    const parsed = updateMenuItemSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const id = Number(resolvedParams.id);

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...parsed.data,
        tags: parsed.data.tags ?? undefined,
      },
    });

    const normalised = {
      ...updated,
      tags: Array.isArray(updated.tags) ? (updated.tags as string[]) : [],
    };

    return NextResponse.json(normalised, { status: 200 });
  } catch (error) {
    console.error("Error updating menu item", error);
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const paramsParse = idParamSchema.safeParse(resolvedParams);
    if (!paramsParse.success) {
      return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
    }

    const id = Number(resolvedParams.id);

    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting menu item", error);
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}

