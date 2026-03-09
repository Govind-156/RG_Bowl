import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: { name: true, phone: true },
        },
        items: {
          include: {
            dish: {
              select: { name: true },
            },
          },
        },
      },
    });

    const payload = orders.map((o) => ({
      id: o.id,
      status: o.status,
      totalAmount: o.totalAmount,
      address: o.address,
      createdAt: o.createdAt,
      paymentId: o.paymentId,
      customerName: o.user.name,
      phone: o.user.phone,
      items: o.items.map((i) => ({
        id: i.id,
        name: i.dish.name,
        quantity: i.quantity,
        price: i.price,
      })),
    }));

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Error fetching orders", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

