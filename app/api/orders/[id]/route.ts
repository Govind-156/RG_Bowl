import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helpers";

const idParamSchema = z.object({
  id: z.string().min(1, "Invalid id"),
});

const updateOrderSchema = z
  .object({
    status: z
      .enum([
        "PLACED",
        "PREPARING",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
      ])
      .optional(),
    deliveryPartnerId: z.string().min(1).optional(),
  })
  .refine((body) => body.status || body.deliveryPartnerId, {
    message: "At least one field (status or deliveryPartnerId) must be provided",
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
    const bodyParse = updateOrderSchema.safeParse(json);

    if (!bodyParse.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: bodyParse.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { id } = paramsParse.data;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(bodyParse.data.status ? { status: bodyParse.data.status } : {}),
        ...(bodyParse.data.deliveryPartnerId
          ? { deliveryPartnerId: bodyParse.data.deliveryPartnerId }
          : {}),
      },
      include: {
        user: { select: { name: true, phone: true } },
        deliveryPartner: { select: { id: true, name: true, phone: true } },
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
      deliveryPartner: updated.deliveryPartner
        ? {
            id: updated.deliveryPartner.id,
            name: updated.deliveryPartner.name,
            phone: updated.deliveryPartner.phone,
          }
        : null,
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
