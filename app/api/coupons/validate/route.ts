import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { DELIVERY_CHARGE } from "@/lib/constants";

const bodySchema = z.object({
  code: z.string().min(1).max(50),
  subtotal: z.number().int().nonnegative(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { code, subtotal } = parsed.data;
    const now = new Date();

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        isActive: true,
        validFrom: { lte: now },
        validTo: { gte: now },
      },
    });

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        message: "Invalid or expired coupon code.",
      });
    }

    const orderCount = await prisma.order.count({
      where: { userId, status: { not: "CANCELLED" } },
    });
    const isFirstOrder = orderCount === 0;

    if (coupon.firstOrderOnly && !isFirstOrder) {
      return NextResponse.json({
        valid: false,
        message: "This coupon is valid for first order only.",
      });
    }

    if (coupon.minOrderValue != null && coupon.minOrderValue > 0 && subtotal < coupon.minOrderValue) {
      return NextResponse.json({
        valid: false,
        message: `Minimum order value for this coupon is ₹${coupon.minOrderValue}.`,
      });
    }

    let discount = 0;
    if (coupon.type === "PERCENT_DISCOUNT") {
      discount = Math.round((subtotal * coupon.value) / 100);
      if (coupon.maxDiscount != null && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.type === "FIXED_OFF") {
      discount = Math.min(coupon.value, subtotal);
    } else if (coupon.type === "FREE_DELIVERY") {
      discount = DELIVERY_CHARGE;
    }

    return NextResponse.json({
      valid: true,
      discount,
      couponId: coupon.id,
      type: coupon.type,
      message:
        coupon.type === "FREE_DELIVERY"
          ? "Free delivery applied."
          : `₹${discount} off applied.`,
    });
  } catch (error) {
    console.error("Coupon validate error", error);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
