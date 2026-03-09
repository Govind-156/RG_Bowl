import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dishes = await prisma.dish.findMany({
      where: { isAvailable: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(dishes, { status: 200 });
  } catch (error) {
    console.error("Error fetching dishes", error);
    return NextResponse.json(
      { error: "Failed to fetch dishes" },
      { status: 500 },
    );
  }
}
