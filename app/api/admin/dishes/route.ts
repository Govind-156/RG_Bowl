import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth-helpers";

const createDishSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.number().int().positive("Price must be positive"),
  image: z.string().optional().nullable(),
  category: z.string().min(1, "Category is required"),
  isAvailable: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const dishes = await prisma.dish.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(dishes, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin dishes", error);
    return NextResponse.json(
      { error: "Failed to fetch dishes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    const parsed = createDishSchema.safeParse({
      ...json,
      price: typeof json.price === "string" ? Number(json.price) : json.price,
    });

    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        { error: "Validation failed", details: msg },
        { status: 400 },
      );
    }

    const dish = await prisma.dish.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        image: parsed.data.image ?? null,
        category: parsed.data.category,
        isAvailable: parsed.data.isAvailable ?? true,
      },
    });
    return NextResponse.json(dish, { status: 201 });
  } catch (error) {
    console.error("Error creating dish", error);
    return NextResponse.json(
      { error: "Failed to create dish" },
      { status: 500 },
    );
  }
}
