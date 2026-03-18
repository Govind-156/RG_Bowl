import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

function parseSubtotal(value: string | null): number | null {
  if (value == null || value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const subtotal = parseSubtotal(url.searchParams.get("subtotal"));
    const now = new Date();

    const [coupons, orderCount, redemptions] = await Promise.all([
      prisma.coupon.findMany({
        where: {
          isActive: true,
          validFrom: { lte: now },
          validTo: { gte: now },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where: { userId, status: { not: "CANCELLED" } } }),
      prisma.couponRedemption.findMany({
        where: { userId },
        select: { couponId: true },
      }),
    ]);

    const usedCouponIds = new Set(redemptions.map((r) => r.couponId));
    const isFirstOrder = orderCount === 0;

    const payload = coupons.map((c) => {
      let eligible = true;
      let reason: string | null = null;

      if (c.firstOrderOnly && !isFirstOrder) {
        eligible = false;
        reason = "First order only";
      } else if (usedCouponIds.has(c.id)) {
        eligible = false;
        reason = "Already used";
      } else if (subtotal != null && (c.minOrderValue ?? 0) > 0 && subtotal < (c.minOrderValue ?? 0)) {
        eligible = false;
        reason = `Min ₹${c.minOrderValue}`;
      }

      return {
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        minOrderValue: c.minOrderValue,
        firstOrderOnly: c.firstOrderOnly,
        maxDiscount: c.maxDiscount,
        validTo: c.validTo.toISOString(),
        eligible,
        reason,
      };
    });

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Coupons list error", error);
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }
}

