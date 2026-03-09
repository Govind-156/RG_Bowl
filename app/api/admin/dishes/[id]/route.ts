import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helpers";

const updateDishSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  image: z.string().optional().nullable(),
  category: z.string().min(1).optional(),
  isAvailable: z.boolean().optional(),
});

const idParamSchema = z.object({
  id: z.string().min(1, "Invalid id"),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = idParamSchema.parse(await params);
    const json = await request.json();
    const parsed = updateDishSchema.safeParse({
      ...json,
      price:
        json.price !== undefined
          ? typeof json.price === "string"
            ? Number(json.price)
            : json.price
          : undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const updatePayload = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.image !== undefined && { image: data.image }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
    };

    const dish = await prisma.dish.update({
      where: { id },
      data: updatePayload,
    });
    return NextResponse.json(dish, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.flatten() },
        { status: 400 },
      );
    }
    console.error("Error updating dish", error);
    return NextResponse.json(
      { error: "Failed to update dish" },
      { status: 500 },
    );
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

    const { id } = idParamSchema.parse(await params);
    await prisma.dish.delete({ where: { id } });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid id" },
        { status: 400 },
      );
    }
    console.error("Error deleting dish", error);
    return NextResponse.json(
      { error: "Failed to delete dish" },
      { status: 500 },
    );
  }
}
