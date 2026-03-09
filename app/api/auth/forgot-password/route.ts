import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_EXPIRY_HOURS = 1;

export async function POST(request: Request) {
  try {
    let body: { email?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        },
      });

      const host = request.headers.get("host");
      const proto = request.headers.get("x-forwarded-proto");
      const baseUrl =
        process.env.NEXTAUTH_URL ||
        (host && proto ? `${proto}://${host}` : host ? `http://${host}` : null) ||
        "http://localhost:3000";
      const resetUrl = `${baseUrl.replace(/\/$/, "")}/reset-password?token=${token}`;

      if (process.env.NODE_ENV === "development") {
        console.log("[Forgot password] Reset link for", email, ":", resetUrl);
      }
      // Optional: if RESEND_API_KEY or similar is set, send email here
    }

    return NextResponse.json(
      {
        message:
          "If an account exists with this email, we've sent a reset link.",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Forgot password error", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
