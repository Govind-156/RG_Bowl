import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentDeliveryPartner } from "@/lib/auth-helpers";

const idParamSchema = z.object({
  id: z.string().min(1, "Invalid id"),
});

const updateStatusSchema = z.object({
  status: z.enum(["DELIVERED", "CANCELLED"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const partner = await getCurrentDeliveryPartner();
    if (!partner) {
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

    const order = await prisma.order.findUnique({
      where: { id },
      select: { id: true, status: true, deliveryPartnerId: true },
    });

    if (!order || order.deliveryPartnerId !== partner.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "OUT_FOR_DELIVERY") {
      return NextResponse.json(
        { error: "Only OUT_FOR_DELIVERY orders can be updated by delivery partners" },
        { status: 400 },
      );
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: bodyParse.data.status },
    });

    return NextResponse.json(
      {
        id: updated.id,
        status: updated.status,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error updating delivery order status", error);
    return NextResponse.json(
      { error: "Failed to update delivery order status" },
      { status: 500 },
    );
  }
}

