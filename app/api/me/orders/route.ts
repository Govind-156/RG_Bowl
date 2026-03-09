import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
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

    const payload = orders.map((order) => ({
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
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Error fetching my orders", error);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 },
    );
  }
}
