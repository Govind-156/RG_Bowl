import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

function generateReferralCode(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        referralCode: true,
        referredById: true,
        freeClassicMaggiAvailable: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.referralCode) {
      let code = generateReferralCode();
      let exists = await prisma.user.findUnique({ where: { referralCode: code } });
      while (exists) {
        code = generateReferralCode();
        exists = await prisma.user.findUnique({ where: { referralCode: code } });
      }
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
      });
      user = { ...user, referralCode: code };
    }

    const orderCount = await prisma.order.count({
      where: { userId },
    });

    const firstOrder25Off = !!user.referredById && orderCount === 0;

    return NextResponse.json(
      {
        firstOrder25Off,
        freeClassicMaggiAvailable: user.freeClassicMaggiAvailable ?? false,
        referralCode: user.referralCode ?? null,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Referral status error", error);
    return NextResponse.json(
      { error: "Failed to load referral status" },
      { status: 500 },
    );
  }
}
