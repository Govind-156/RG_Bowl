import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";
import ProfileOrdersList from "@/components/profile/ProfileOrdersList";
import ProfileUpdatedBanner from "@/components/profile/ProfileUpdatedBanner";
import ReferFriendsSection from "@/components/profile/ReferFriendsSection";
import { prisma } from "@/lib/prisma";

function getUserLevel(totalOrders: number): string {
  if (totalOrders >= 25) return "PG Legend 👑";
  if (totalOrders >= 10) return "Maggi Addict 🔥";
  if (totalOrders >= 5) return "Midnight Survivor";
  if (totalOrders >= 1) return "Maggi Beginner";
  return "Newbie";
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/profile");
  }

  const user = session.user as { id?: string | null; name?: string | null; email?: string | null; phone?: string | null };
  const userId = user.id ?? null;
  const totalOrders = userId
    ? await prisma.order.count({
        where: { userId, status: { not: "CANCELLED" } },
      })
    : 0;
  const level = getUserLevel(totalOrders);

  return (
    <main className="flex min-h-screen flex-col items-center bg-black px-6 py-12 text-zinc-50">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h1 className="mb-4 text-xl font-semibold tracking-tight">Profile</h1>
        <ProfileUpdatedBanner />
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Name</dt>
            <dd className="mt-0.5 text-zinc-100">{user.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Level</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-zinc-100">
              <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-200">
                {level}
              </span>
              <span className="text-xs text-zinc-500">({totalOrders} orders)</span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Email</dt>
            <dd className="mt-0.5 text-zinc-100">{user.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Phone</dt>
            <dd className="mt-0.5 text-zinc-100">{user.phone ?? "—"}</dd>
          </div>
        </dl>
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/profile/edit"
              className="inline-flex items-center rounded-full border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
            >
              Edit profile
            </Link>
            <Link
              href="/my-referrals"
              className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/20"
            >
              My referrals
            </Link>
          </div>
        </div>

        <ReferFriendsSection />

        <ProfileOrdersList />

        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black shadow-md hover:bg-amber-300"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
