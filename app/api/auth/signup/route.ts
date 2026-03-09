import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referralCode: z.string().optional(),
  ref: z.string().optional(),
});

function generateReferralCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = signupSchema.safeParse(json);

    if (!parsed.success) {
      const details = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details },
        { status: 400 },
      );
    }

    const { name, email, phone, password, referralCode: refCode, ref } = parsed.data;
    const referralCodeRaw = (refCode ?? ref ?? "").trim();

    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }

    let referredById: string | null = null;
    if (referralCodeRaw) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode: referralCodeRaw },
        select: { id: true },
      });
      if (referrer) referredById = referrer.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let newUserReferralCode = generateReferralCode();
    let codeExists = await prisma.user.findUnique({ where: { referralCode: newUserReferralCode } });
    while (codeExists) {
      newUserReferralCode = generateReferralCode();
      codeExists = await prisma.user.findUnique({ where: { referralCode: newUserReferralCode } });
    }

    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "CUSTOMER",
        referredById,
        referralCode: newUserReferralCode,
      },
    });

    return NextResponse.json(
      { success: true, message: "Account created. You can now log in." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Signup error", error);
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 },
    );
  }
}
