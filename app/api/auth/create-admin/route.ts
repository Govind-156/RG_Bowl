import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * One-off route to create a new admin user (for copied/setup projects only).
 * Only works when CREATE_ADMIN_SECRET is set; send it in the X-Create-Admin-Secret header.
 * Does not modify existing users; returns 409 if email already exists.
 *
 * IMPORTANT: Disable or remove this route in production. Do not set CREATE_ADMIN_SECRET
 * in production env, or delete this file before deployment.
 */
export async function POST(request: Request) {
  const secret = process.env.CREATE_ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Create-admin not configured (set CREATE_ADMIN_SECRET)." },
      { status: 501 },
    );
  }

  const provided = request.headers.get("X-Create-Admin-Secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { email, password } = body;
  if (!email || typeof email !== "string" || !email.trim()) {
    return NextResponse.json(
      { error: "Missing or invalid email" },
      { status: 400 },
    );
  }
  if (!password || typeof password !== "string" || password.length < 6) {
    return NextResponse.json(
      { error: "password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists. Use a different email." },
      { status: 409 },
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name: "Admin",
      email: normalizedEmail,
      password: hashedPassword,
      phone: "0000000000",
      role: "ADMIN",
    },
  });

  return NextResponse.json({
    success: true,
    message: "Admin user created. You can log in with this email and password.",
  });
}
