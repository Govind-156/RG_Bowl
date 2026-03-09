import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helpers";

const idParamSchema = z.object({
  id: z.string().min(1, "Invalid id"),
});

const updateStatusSchema = z.object({
  status: z.enum([
    "PLACED",
    "PREPARING",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "CANCELLED",
  ]),
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
    const bodyParse = updateStatusSchema.safeParse(json);

    if (!bodyParse.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: bodyParse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { id } = paramsParse.data;

    const updated = await prisma.order.update({
      where: { id },
      data: { status: bodyParse.data.status },
      include: {
        user: { select: { name: true, phone: true } },
        items: {
          include: {
            dish: { select: { name: true } },
          },
        },
      },
    });

    const payload = {
      id: updated.id,
      status: updated.status,
      totalAmount: updated.totalAmount,
      address: updated.address,
      createdAt: updated.createdAt,
      paymentId: updated.paymentId,
      customerName: updated.user.name,
      phone: updated.user.phone,
      items: updated.items.map((i) => ({
        id: i.id,
        name: i.dish.name,
        quantity: i.quantity,
        price: i.price,
      })),
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Error updating order", error);
    return NextResponse.json(
      { error: "Failed to update order" },
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

    const resolvedParams = await params;
    const paramsParse = idParamSchema.safeParse(resolvedParams);
    if (!paramsParse.success) {
      return NextResponse.json({ error: "Invalid id parameter" }, { status: 400 });
    }

    const { id } = paramsParse.data;

    await prisma.order.delete({
      where: { id },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting order", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 },
    );
  }
}
