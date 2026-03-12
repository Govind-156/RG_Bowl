import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const identifier =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "anonymous";

    const rate = await checkRateLimit(identifier, {
      windowMs: 15 * 60 * 1000,
      max: 5,
    });
    if (!rate.ok) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again in a few minutes." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
      );
    }

    let body: {
      name?: string;
      email?: string;
      message?: string;
      orderId?: string;
      type?: "GENERAL" | "COMPLAINT" | string;
      imageUrl?: string;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 },
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() || null : null;
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() || null : null;
    const rawType = typeof body.type === "string" ? body.type.toUpperCase() : "GENERAL";
    const type: "GENERAL" | "COMPLAINT" =
      rawType === "COMPLAINT" ? "COMPLAINT" : "GENERAL";
    const imageUrl =
      typeof body.imageUrl === "string" && body.imageUrl.trim()
        ? body.imageUrl.trim()
        : null;

    await prisma.contactSubmission.create({
      data: {
        name,
        email,
        message,
        orderId,
        type,
        imageUrl,
      },
    });

    return NextResponse.json(
      { message: "Thanks, we'll get back to you." },
      { status: 200 },
    );
  } catch (error) {
    console.error("Contact submission error", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
