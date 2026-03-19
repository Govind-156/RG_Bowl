import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPush } from "@/lib/push";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function withNamePrefix(name: string | null | undefined, message: string) {
  const trimmed = name?.trim();
  if (!trimmed) return message;
  return `Hey ${trimmed} 👋\n${message}`;
}

function pickGeneralMessage() {
  const list = [
    "Your roommate is about to order without you 👀",
    "Maggi > assignments 😭",
    "Chef is bored… order something 🍜",
    "Don’t sleep hungry 😴",
  ];
  return list[Math.floor(Math.random() * list.length)];
}

function pickPayload(user: {
  name: string;
  lastOrderAt: Date | null;
  totalOrders: number;
  preferredOrderTime: number | null;
}) {
  const now = new Date();
  const hour = now.getHours();
  const hoursSinceLastOrder = user.lastOrderAt
    ? (now.getTime() - user.lastOrderAt.getTime()) / (1000 * 60 * 60)
    : null;

  if (hoursSinceLastOrder != null && hoursSinceLastOrder > 48) {
    return {
      title: "We miss you 😭",
      body: withNamePrefix(user.name, "Come back for a hot bowl 🍜"),
      trigger: "inactivity",
    };
  }

  if (
    user.preferredOrderTime != null &&
    Number.isInteger(user.preferredOrderTime) &&
    Math.abs(hour - user.preferredOrderTime) <= 1
  ) {
    return {
      title: "Your usual Maggi time 👀",
      body: withNamePrefix(user.name, "We’re ready 🍜"),
      trigger: "habit",
    };
  }

  if (hour >= 22) {
    return {
      title: "Still awake? 😏",
      body: withNamePrefix(user.name, "Perfect time for Maggi 🍜🔥"),
      trigger: "late-night",
    };
  }

  if (user.totalOrders >= 10) {
    return {
      title: "VIP alert 🔥",
      body: withNamePrefix(user.name, "Your favorite bowl is waiting 😌"),
      trigger: "vip",
    };
  }

  return {
    title: "Hungry? 🍜",
    body: withNamePrefix(user.name, pickGeneralMessage()),
    trigger: "general",
  };
}

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const incoming = request.headers.get("x-cron-secret");
      if (incoming !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    const dayStart = startOfToday();
    const users = await prisma.user.findMany({
      where: {
        pushSubscriptions: { some: {} },
      },
      select: {
        id: true,
        name: true,
        lastOrderAt: true,
        totalOrders: true,
        preferredOrderTime: true,
        lastNotificationSentAt: true,
        pushSubscriptions: {
          select: { id: true, subscription: true },
        },
      },
    });

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      if (
        user.lastNotificationSentAt &&
        now.getTime() - user.lastNotificationSentAt.getTime() < 24 * 60 * 60 * 1000
      ) {
        skippedCount += 1;
        continue;
      }

      const orderedToday = await prisma.order.count({
        where: {
          userId: user.id,
          createdAt: { gte: dayStart },
        },
      });
      if (orderedToday > 0) {
        skippedCount += 1;
        continue;
      }

      const payload = pickPayload(user);
      let userSent = false;

      for (const sub of user.pushSubscriptions) {
        try {
          await sendPush(
            sub.subscription as {
              endpoint: string;
              expirationTime?: number | null;
              keys: { p256dh: string; auth: string };
            },
            payload.title,
            payload.body,
          );
          userSent = true;
        } catch (error) {
          console.error("Push send failed", { userId: user.id, subId: sub.id, error });
        }
      }

      if (userSent) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastNotificationSentAt: now },
        });
        sentCount += 1;
      } else {
        skippedCount += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      sentCount,
      skippedCount,
      scannedUsers: users.length,
    });
  } catch (error) {
    console.error("Smart notification cron failed", error);
    return NextResponse.json({ error: "Failed to send notifications." }, { status: 500 });
  }
}
