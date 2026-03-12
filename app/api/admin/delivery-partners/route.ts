import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helpers";

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partners = await prisma.user.findMany({
      where: { role: "DELIVERY" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(partners, { status: 200 });
  } catch (error) {
    console.error("Error fetching delivery partners", error);
    return NextResponse.json({ error: "Failed to load delivery partners" }, { status: 500 });
  }
}

