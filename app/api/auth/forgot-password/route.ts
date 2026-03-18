import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const OTP_EXPIRY_MINUTES = 5;

function generateOtp(): string {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return String(otp);
}

export async function POST(request: Request) {
  try {
    console.log("[Forgot password] API called");
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
    console.log("[Forgot password] Email received:", email);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
      console.log("[Forgot password] OTP generated:", otp, "expires:", expiresAt.toISOString());

      // Delete any previous tokens for this user to avoid confusion.
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Store OTP in existing table (token field) to avoid DB schema changes.
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token: otp,
          expiresAt,
        },
      });

      const resendApiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.EMAIL_FROM;

      if (!resendApiKey || !fromEmail) {
        console.warn(
          "[Forgot password] Resend not configured: RESEND_API_KEY or EMAIL_FROM missing. Set them in Vercel env vars."
        );
      } else {
        const resend = new Resend(resendApiKey);
        const supportEmail = process.env.SUPPORT_EMAIL || fromEmail;

        console.log("[Forgot password] Sending OTP email via Resend...");
        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: email,
          replyTo: supportEmail,
          subject: "Reset Password OTP",
          html: `
            <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5;">
              <h2 style="margin-bottom: 12px;">Reset Password OTP</h2>
              <p style="margin: 0 0 12px 0;">Use this OTP to reset your RG Bowl password.</p>
              <p style="margin: 0 0 16px 0;">Your OTP is:</p>
              <p style="margin: 0 0 16px 0; font-size: 28px; letter-spacing: 6px; font-weight: 700;">
                ${otp}
              </p>
              <p style="margin: 0; font-size: 13px; color:#6b7280;">
                This OTP expires in ${OTP_EXPIRY_MINUTES} minutes. If you didn&apos;t request this, ignore this email.
              </p>
            </div>
          `,
        });

        if (error) {
          console.error("[Forgot password] Resend error:", JSON.stringify(error));
        } else if (data?.id) {
          console.log("[Forgot password] Email sent, id:", data.id);
        }
      }
    } else {
      console.log("[Forgot password] User not found for email:", email);
    }

    return NextResponse.json(
      {
        message:
          "If an account exists with this email, we've sent an OTP.",
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
