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
      orderBy: { createdAt: "asc" },
    });

    if (orders.length === 0) {
      return NextResponse.json(
        {
          repeatCustomerPercent: 0,
          averageOrderValue: 0,
          peakHour: null,
          topPgs: [],
          totalOrders: 0,
        },
        { status: 200 },
      );
    }

    const userOrderCounts = new Map<string, number>();
    const hourCounts = new Map<number, number>();
    const addressCounts = new Map<string, { orders: number; revenue: number }>();

    let totalRevenue = 0;

    for (const order of orders) {
      // Repeat customers (by userId)
      const userKey = order.userId;
      userOrderCounts.set(userKey, (userOrderCounts.get(userKey) ?? 0) + 1);

      // Peak order time (hour of day)
      const createdAt = new Date(order.createdAt);
      const hour = createdAt.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);

      // Top locations (by address: order count and revenue)
      const addressKey = order.address.trim() || "Unknown";
      const existing = addressCounts.get(addressKey) ?? { orders: 0, revenue: 0 };
      addressCounts.set(addressKey, {
        orders: existing.orders + 1,
        revenue: existing.revenue + order.totalAmount,
      });

      totalRevenue += order.totalAmount;
    }

    const totalOrders = orders.length;
    const customersWithMoreThanOneOrder = Array.from(userOrderCounts.values()).filter(
      (count) => count > 1,
    ).length;
    const totalUniqueUsers = userOrderCounts.size;

    const repeatCustomerPercent =
      totalUniqueUsers === 0
        ? 0
        : Math.round((customersWithMoreThanOneOrder / totalUniqueUsers) * 100);

    const averageOrderValue = totalOrders === 0 ? 0 : Math.round(totalRevenue / totalOrders);

    const peakHourEntry =
      hourCounts.size > 0
        ? Array.from(hourCounts.entries()).sort((a, b) => b[1] - a[1])[0]
        : null;
    const peakHour = peakHourEntry ? peakHourEntry[0] : null;

    const topPgs = Array.from(addressCounts.entries())
      .sort((a, b) => b[1].orders - a[1].orders)
      .slice(0, 5)
      .map(([name, stats]) => ({
        name,
        orders: stats.orders,
        revenue: stats.revenue,
      }));

    return NextResponse.json(
      {
        repeatCustomerPercent,
        averageOrderValue,
        peakHour,
        topPgs,
        totalOrders,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error computing analytics summary", error);
    return NextResponse.json({ error: "Failed to load analytics summary" }, { status: 500 });
  }
}

