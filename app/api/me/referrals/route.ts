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

function getBaseUrl(request: Request): string {
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto");
  return (
    process.env.NEXTAUTH_URL ||
    (host && proto ? `${proto}://${host}` : host ? `http://${host}` : null) ||
    "http://localhost:3000"
  );
}

type ReferredUserRow = {
  id: string;
  name: string | null;
  createdAt: Date;
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
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

    const referralCode = user.referralCode as string;
    const referralLink = `${getBaseUrl(request).replace(/\/$/, "")}/signup?ref=${encodeURIComponent(referralCode)}`;

    const referredUsers = (await prisma.user.findMany({
      where: { referredById: userId },
      select: { id: true, name: true, createdAt: true },
      take: 50,
    })) satisfies ReferredUserRow[];

    const referredUserIds = referredUsers.map((u) => u.id);

    const perUser = new Map<
      string,
      { ordersCount: number; firstOrderAt: Date | null; lastOrderAt: Date | null }
    >();

    if (referredUserIds.length > 0) {
      const orders = await prisma.order.findMany({
        where: { userId: { in: referredUserIds } },
        select: { userId: true, createdAt: true },
      });

      for (const o of orders) {
        const existing = perUser.get(o.userId) ?? {
          ordersCount: 0,
          firstOrderAt: null,
          lastOrderAt: null,
        };
        existing.ordersCount += 1;
        existing.firstOrderAt =
          existing.firstOrderAt === null || o.createdAt < existing.firstOrderAt
            ? o.createdAt
            : existing.firstOrderAt;
        existing.lastOrderAt =
          existing.lastOrderAt === null || o.createdAt > existing.lastOrderAt
            ? o.createdAt
            : existing.lastOrderAt;
        perUser.set(o.userId, existing);
      }
    }

    const referredUsersEnriched = referredUsers
      .map((u) => {
        const stats = perUser.get(u.id) ?? {
          ordersCount: 0,
          firstOrderAt: null,
          lastOrderAt: null,
        };
        return {
          id: u.id,
          name: u.name ?? "—",
          createdAt: u.createdAt,
          hasOrdered: stats.ordersCount > 0,
          firstOrderAt: stats.firstOrderAt,
          ordersCount: stats.ordersCount,
          lastOrderAt: stats.lastOrderAt,
        };
      })
      .sort((a, b) => {
        if (a.hasOrdered !== b.hasOrdered) return a.hasOrdered ? -1 : 1;
        if (a.hasOrdered && b.hasOrdered) {
          const at = a.lastOrderAt?.getTime() ?? 0;
          const bt = b.lastOrderAt?.getTime() ?? 0;
          return bt - at;
        }
        return (b.createdAt as Date).getTime() - (a.createdAt as Date).getTime();
      });

    const referredUsersTotal = referredUsers.length;
    const referredUsersWithAtLeastOneOrder = referredUsersEnriched.filter((u) => u.hasOrdered).length;
    const remainingForReward = Math.max(0, 3 - referredUsersWithAtLeastOneOrder);

    return NextResponse.json(
      {
        referralCode,
        referralLink,
        freeClassicMaggiAvailable: user.freeClassicMaggiAvailable ?? false,
        referredUsersTotal,
        referredUsersWithAtLeastOneOrder,
        remainingForReward,
        referredUsers: referredUsersEnriched,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("My referrals error", error);
    return NextResponse.json({ error: "Failed to load referrals" }, { status: 500 });
  }
}

