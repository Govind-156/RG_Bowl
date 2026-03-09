import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Order ID required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            dish: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (userId && order.userId !== userId) {
      return NextResponse.json({ error: "You don't have access to this order." }, { status: 403 });
    }

    const payload = {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      address: order.address,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        dishId: item.dishId,
        name: item.dish.name,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Error fetching order for tracking", error);
    return NextResponse.json(
      { error: "Failed to load order" },
      { status: 500 },
    );
  }
}
