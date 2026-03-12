import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
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

      const resendApiKey = process.env.RESEND_API_KEY;
      const fromEmail = process.env.EMAIL_FROM;

      if (resendApiKey && fromEmail) {
        try {
          const resend = new Resend(resendApiKey);
          const supportEmail = process.env.SUPPORT_EMAIL || fromEmail;

          await resend.emails.send({
            from: fromEmail,
            to: email,
            reply_to: supportEmail,
            subject: "Reset your RG Bowl password",
            html: `
              <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5;">
                <h2 style="margin-bottom: 12px;">Reset your RG Bowl password</h2>
                <p style="margin: 0 0 12px 0;">We received a request to reset the password for your RG Bowl account.</p>
                <p style="margin: 0 0 16px 0;">Click the button below to choose a new password. This link will expire in 1 hour.</p>
                <p style="margin: 0 0 16px 0;">
                  <a href="${resetUrl}" style="display:inline-block;padding:10px 18px;border-radius:9999px;background:#fbbf24;color:#000;text-decoration:none;font-weight:600;">
                    Reset password
                  </a>
                </p>
                <p style="margin: 0 0 8px 0; font-size: 14px; color:#4b5563;">
                  If the button doesn&apos;t work, copy and paste this link into your browser:
                </p>
                <p style="margin: 0 0 16px 0; font-size: 13px; color:#6b7280; word-break:break-all;">
                  ${resetUrl}
                </p>
                <p style="margin: 0; font-size: 13px; color:#6b7280;">
                  If you didn&apos;t request this, you can safely ignore this email.
                </p>
              </div>
            `,
          });
        } catch (err) {
          console.error("Error sending reset email via Resend", err);
        }
      }
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
