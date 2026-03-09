import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * One-off route to fix user passwords (e.g. accounts created with plain text).
 * Only works when FIX_PASSWORD_SECRET is set; send it in the X-Fix-Password-Secret header.
 * Remove or disable this route in production.
 */
export async function POST(request: Request) {
  const secret = process.env.FIX_PASSWORD_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Fix-password not configured (set FIX_PASSWORD_SECRET)." },
      { status: 501 },
    );
  }

  const provided = request.headers.get("X-Fix-Password-Secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { email, newPassword } = body;
  if (!email || typeof email !== "string" || !email.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid email" },
      { status: 400 },
    );
  }
  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    return NextResponse.json(
      { error: "newPassword must be at least 6 characters" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user) {
    return NextResponse.json(
      { error: "No user found with this email" },
      { status: 404 },
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  return NextResponse.json({
    success: true,
    message: "Password updated. You can log in with the new password.",
  });
}
