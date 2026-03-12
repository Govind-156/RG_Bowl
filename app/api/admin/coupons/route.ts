import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helpers";

const createCouponSchema = z.object({
  code: z.string().min(1).max(50),
  type: z.enum(["PERCENT_DISCOUNT", "FREE_DELIVERY", "FIXED_OFF"]),
  value: z.number().int().min(0),
  minOrderValue: z.number().int().min(0).optional(),
  firstOrderOnly: z.boolean().optional(),
  maxDiscount: z.number().int().min(0).optional(),
  // Accept any string (including datetime-local like 2026-03-13T09:28) or omit and default server-side.
  validTo: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      coupons.map((c) => ({
        id: c.id,
        code: c.code,
        type: c.type,
        value: c.value,
        minOrderValue: c.minOrderValue,
        firstOrderOnly: c.firstOrderOnly,
        maxDiscount: c.maxDiscount,
        validFrom: c.validFrom.toISOString(),
        validTo: c.validTo.toISOString(),
        isActive: c.isActive,
        createdAt: c.createdAt.toISOString(),
      })),
    );
  } catch (error) {
    console.error("Error fetching coupons", error);
    return NextResponse.json({ error: "Failed to load coupons" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = createCouponSchema.safeParse({
      ...json,
      validTo: json.validTo ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const code = data.code.trim().toUpperCase();

    const existing = await prisma.coupon.findUnique({
      where: { code },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A coupon with this code already exists." },
        { status: 409 },
      );
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        type: data.type,
        value: data.value,
        minOrderValue: data.minOrderValue ?? 0,
        firstOrderOnly: data.firstOrderOnly ?? false,
        maxDiscount: data.maxDiscount ?? undefined,
        validTo: new Date(data.validTo),
        isActive: data.isActive ?? true,
      },
    });

    return NextResponse.json(
      {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minOrderValue: coupon.minOrderValue,
        firstOrderOnly: coupon.firstOrderOnly,
        maxDiscount: coupon.maxDiscount,
        validFrom: coupon.validFrom.toISOString(),
        validTo: coupon.validTo.toISOString(),
        isActive: coupon.isActive,
        createdAt: coupon.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating coupon", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
