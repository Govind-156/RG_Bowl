import { NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const orderItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().int().nonnegative(),
});

const orderPayloadSchema = z.object({
  userId: z.string().min(1, "User is required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  items: z.array(orderItemSchema).min(1, "At least one item required"),
  totalAmount: z.number().int().positive(),
  referralDiscountAmount: z.number().int().nonnegative().optional(),
  usedFreeClassicMaggi: z.boolean().optional(),
});

const verifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  order: orderPayloadSchema,
});

export async function POST(request: Request) {
  try {
    const identifier =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const rate = await checkRateLimit(identifier, { windowMs: 60_000, max: 20 });
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many verification attempts. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
      );
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay secret key is not configured on the server." },
        { status: 500 },
      );
    }

    const json = await request.json();
    const parsed = verifySchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order } = parsed.data;

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (settings?.isOrderingPaused) {
      return NextResponse.json(
        { error: settings.pauseReason?.trim() || "Ordering is currently paused. Your payment was not recorded. Please try again later or contact support if you were charged." },
        { status: 503 },
      );
    }

    const referralDiscountAmount = order.referralDiscountAmount ?? 0;
    const usedFreeClassicMaggi = order.usedFreeClassicMaggi ?? false;

    // Create Order and OrderItems in a single transaction so both succeed or both roll back.
    const createdOrder = await prisma.$transaction(async (tx) => {
      // 1. Create Order record with address, location, status PLACED, and referral fields.
      const newOrder = await tx.order.create({
        data: {
          userId: order.userId,
          totalAmount: order.totalAmount,
          paymentId: razorpay_payment_id,
          status: "PLACED",
          address: order.address,
          latitude: order.latitude ?? undefined,
          longitude: order.longitude ?? undefined,
          referralDiscountAmount,
          usedFreeClassicMaggi,
        },
      });

      // 2. Save order items for this order.
      await tx.orderItem.createMany({
        data: order.items.map((item) => ({
          orderId: newOrder.id,
          dishId: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      // 3. If this is the customer's first order and they were referred, check if referrer earns free Classic Maggi.
      const orderCountForUser = await tx.order.count({ where: { userId: order.userId } });
      if (orderCountForUser === 1) {
        const orderingUser = await tx.user.findUnique({
          where: { id: order.userId },
          select: { referredById: true },
        });
        if (orderingUser?.referredById) {
          const referredUserIds = (
            await tx.user.findMany({
              where: { referredById: orderingUser.referredById },
              select: { id: true },
            })
          ).map((u) => u.id);
          const ordersByReferred = await tx.order.findMany({
            where: { userId: { in: referredUserIds } },
            select: { userId: true },
          });
          const uniqueReferredWithOrders = new Set(ordersByReferred.map((o) => o.userId)).size;
          if (uniqueReferredWithOrders >= 3) {
            await tx.user.update({
              where: { id: orderingUser.referredById },
              data: { freeClassicMaggiAvailable: true },
            });
          }
        }
      }

      // 4. If customer used their free Classic Maggi reward, consume it.
      if (usedFreeClassicMaggi) {
        await tx.user.update({
          where: { id: order.userId },
          data: { freeClassicMaggiAvailable: false },
        });
      }

      return newOrder;
    });

    return NextResponse.json({ success: true, order: createdOrder }, { status: 201 });
  } catch (error) {
    console.error("Error verifying Razorpay payment", error);
    return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
  }
}
