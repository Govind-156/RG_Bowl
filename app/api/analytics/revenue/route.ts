import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helpers";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - 6); // last 7 days including today

    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: weekStart,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    let todayRevenue = 0;
    let todayOrders = 0;
    let weeklyRevenue = 0;
    let totalRevenue = 0;

    const dailyMap = new Map<string, number>();
    const itemCounts = new Map<string, number>();

    const orderItems = await prisma.orderItem.findMany({
      where: { order: { createdAt: { gte: weekStart } } },
      select: {
        quantity: true,
        dish: { select: { name: true } },
        order: { select: { createdAt: true } },
      },
    });

    for (const item of orderItems) {
      const itemName = item.dish?.name;
      if (!itemName || typeof item.quantity !== "number") continue;
      itemCounts.set(itemName, (itemCounts.get(itemName) ?? 0) + item.quantity);
    }

    for (const order of orders) {
      const createdAt = new Date(order.createdAt);
      const dayKey = startOfDay(createdAt).toISOString().slice(0, 10); // YYYY-MM-DD

      weeklyRevenue += order.totalAmount;
      totalRevenue += order.totalAmount;

      if (createdAt >= todayStart) {
        todayRevenue += order.totalAmount;
        todayOrders += 1;
      }

      dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + order.totalAmount);
    }

    // If we need lifetime revenue beyond 7 days, query separately:
    const lifetimeAgg = await prisma.order.aggregate({
      _sum: { totalAmount: true },
    });
    totalRevenue = lifetimeAgg._sum.totalAmount ?? totalRevenue;

    const bestSellingItem =
      itemCounts.size > 0
        ? Array.from(itemCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
        : null;

    const dailyRevenue = Array.from(dailyMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, amount]) => ({ date, amount }));

    return NextResponse.json(
      {
        todayRevenue,
        todayOrders,
        weeklyRevenue,
        totalRevenue,
        bestSellingItem,
        dailyRevenue,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error computing revenue analytics", error);
    return NextResponse.json({ error: "Failed to load revenue analytics" }, { status: 500 });
  }
}

