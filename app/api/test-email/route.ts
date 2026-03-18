import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  try {
    console.log("[Test email] API called");
    let body: { to?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const to = typeof body.to === "string" ? body.to.trim().toLowerCase() : "";
    if (!to) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;
    if (!resendApiKey || !fromEmail) {
      return NextResponse.json(
        { error: "Resend is not configured (RESEND_API_KEY / EMAIL_FROM missing)" },
        { status: 500 },
      );
    }

    const resend = new Resend(resendApiKey);
    const supportEmail = process.env.SUPPORT_EMAIL || fromEmail;

    console.log("[Test email] Sending email via Resend to:", to);
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      replyTo: supportEmail,
      subject: "RG Bowl – Test email",
      html: "<p>This is a test email from RG Bowl Resend integration.</p>",
    });

    if (error) {
      console.error("[Test email] Resend error:", JSON.stringify(error));
      return NextResponse.json({ error: "Resend error", details: error }, { status: 500 });
    }

    console.log("[Test email] Sent, id:", data?.id);
    return NextResponse.json({ success: true, id: data?.id }, { status: 200 });
  } catch (err) {
    console.error("[Test email] Error", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

