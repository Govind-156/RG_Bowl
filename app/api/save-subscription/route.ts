import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type SubscriptionBody = {
  subscription?: unknown;
};

function isValidSubscription(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return Boolean(obj.endpoint && obj.keys && typeof obj.endpoint === "string");
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: SubscriptionBody;
    try {
      body = (await request.json()) as SubscriptionBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (!isValidSubscription(body.subscription)) {
      return NextResponse.json({ error: "Invalid subscription payload." }, { status: 400 });
    }

    await prisma.pushSubscription.create({
      data: {
        userId,
        subscription: body.subscription as object,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to save push subscription", error);
    return NextResponse.json({ error: "Failed to save subscription." }, { status: 500 });
  }
}
