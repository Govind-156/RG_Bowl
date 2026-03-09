import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helpers";

function startOfDay(date: Date): Date {
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
    weekStart.setDate(todayStart.getDate() - 6);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: weekStart },
      },
      orderBy: { createdAt: "asc" },
      include: {
        items: {
          include: {
            dish: { select: { name: true } },
          },
        },
      },
    });

    let todayRevenue = 0;
    let todayOrders = 0;
    let weeklyRevenue = 0;
    const dailyMap = new Map<string, number>();
    const dishCounts = new Map<string, number>();

    for (const order of orders) {
      const createdAt = new Date(order.createdAt);
      const dayKey = startOfDay(createdAt).toISOString().slice(0, 10);

      weeklyRevenue += order.totalAmount;
      dailyMap.set(dayKey, (dailyMap.get(dayKey) ?? 0) + order.totalAmount);

      if (createdAt >= todayStart) {
        todayRevenue += order.totalAmount;
        todayOrders += 1;
      }

      for (const item of order.items) {
        const name = item.dish.name;
        dishCounts.set(name, (dishCounts.get(name) ?? 0) + item.quantity);
      }
    }

    const bestSellingDish =
      dishCounts.size > 0
        ? Array.from(dishCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
        : null;

    const dailyRevenue = Array.from(dailyMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, amount]) => ({ date, amount }));

    return NextResponse.json(
      {
        todayRevenue,
        todayOrders,
        weeklyRevenue,
        bestSellingDish,
        dailyRevenue,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error loading admin analytics", error);
    return NextResponse.json(
      { error: "Failed to load analytics" },
      { status: 500 },
    );
  }
}
