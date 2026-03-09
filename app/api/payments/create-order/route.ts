import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const settings = await prisma.settings.findUnique({ where: { id: 1 } });
    if (settings?.isOrderingPaused) {
      return NextResponse.json(
        { error: settings.pauseReason?.trim() || "Ordering is currently paused. Please try again later." },
        { status: 503 },
      );
    }

    const identifier =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const rate = await checkRateLimit(identifier, { windowMs: 60_000, max: 20 });
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many payment attempts. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
      );
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay keys are not configured on the server." },
        { status: 500 },
      );
    }

    const json = await request.json();
    const { amount, currency = "INR", receipt, notes } = json ?? {};

    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount <= 0 ||
      typeof receipt !== "string" ||
      !receipt
    ) {
      return NextResponse.json(
        { error: "Invalid request body", details: { amount, receipt } },
        { status: 400 },
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt,
      notes,
    });

    return NextResponse.json(
      {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at,
        keyId,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("Error creating Razorpay order", error);
    return NextResponse.json(
      {
        error: "Failed to create Razorpay order",
        message: error instanceof Error ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}
