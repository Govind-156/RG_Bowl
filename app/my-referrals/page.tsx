"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type ReferredUser = {
  id: string;
  name: string;
  createdAt: string;
  hasOrdered: boolean;
  firstOrderAt: string | null;
  ordersCount: number;
};

type MyReferralsPayload = {
  referralCode: string;
  referralLink: string;
  freeClassicMaggiAvailable: boolean;
  referredUsersTotal: number;
  referredUsersWithAtLeastOneOrder: number;
  remainingForReward: number;
  referredUsers: ReferredUser[];
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });
}

export default function MyReferralsPage() {
  const router = useRouter();
  const { status } = useSession();

  const [data, setData] = useState<MyReferralsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/my-referrals");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    async function fetchReferrals() {
      try {
        setError(null);
        const res = await fetch("/api/me/referrals", { cache: "no-store" });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || "Failed to load referrals.");
        }
        const payload = (await res.json()) as MyReferralsPayload;
        if (!cancelled) setData(payload);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Failed to load referrals.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchReferrals();
    return () => {
      cancelled = true;
    };
  }, [status]);

  const progress = useMemo(() => {
    const completed = data?.referredUsersWithAtLeastOneOrder ?? 0;
    const goal = 3;
    const pct = Math.min(100, Math.round((completed / goal) * 100));
    return { completed, goal, pct };
  }, [data?.referredUsersWithAtLeastOneOrder]);

  const handleCopy = async () => {
    const link = data?.referralLink;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (status === "loading" || status === "unauthenticated" || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-zinc-50 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              My referrals
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Invite friends. They get{" "}
              <span className="font-semibold text-amber-300">25% off</span> their
              first order. After{" "}
              <span className="font-semibold text-amber-300">3 friends</span>{" "}
              place an order, you unlock a{" "}
              <span className="font-semibold text-amber-300">free Classic Maggi</span>.
            </p>
          </div>
          <Link href="/profile" className="text-sm text-amber-400 hover:text-amber-300">
            ← Profile
          </Link>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {data && (
          <>
            <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-6">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Your referral link
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  readOnly
                  value={data.referralLink}
                  className="w-full flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-full border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-400/20"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                Referral code:{" "}
                <span className="font-mono text-zinc-300">{data.referralCode}</span>
              </p>
            </section>

            <section className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Progress
                </h2>
                <p className="text-sm text-zinc-200">
                  {progress.completed}/{progress.goal} friends ordered
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-amber-400"
                    style={{ width: `${progress.pct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  {data.remainingForReward === 0
                    ? "Reward unlocked."
                    : `Invite ${data.remainingForReward} more friend(s) who place an order to unlock your reward.`}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Reward
                </h2>
                {data.freeClassicMaggiAvailable ? (
                  <>
                    <p className="text-sm font-semibold text-emerald-300">
                      Free Classic Maggi unlocked
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      It will apply automatically at checkout on your next order.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-zinc-200">Not unlocked yet</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      Once 3 referred friends place at least one order, you’ll get a free Classic Maggi.
                    </p>
                  </>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-6">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Referred friends
              </h2>

              {data.referredUsersTotal === 0 ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-4">
                  <p className="text-sm text-zinc-300">No referrals yet.</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Copy your referral link above and share it with friends.
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {data.referredUsers.map((u) => (
                    <li
                      key={u.id}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-zinc-100">{u.name}</p>
                          <p className="mt-0.5 text-xs text-zinc-500">
                            Joined {formatDateTime(u.createdAt)}
                          </p>
                          {u.hasOrdered && (
                            <p className="mt-0.5 text-xs text-zinc-500">
                              First order {formatDateTime(u.firstOrderAt)}
                              {u.ordersCount ? ` · ${u.ordersCount} order(s)` : ""}
                            </p>
                          )}
                        </div>
                        <span
                          className={
                            u.hasOrdered
                              ? "rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300"
                              : "rounded-full bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300"
                          }
                        >
                          {u.hasOrdered ? "Ordered" : "Not ordered yet"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

