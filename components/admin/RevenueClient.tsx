"use client";

import { useEffect, useState } from "react";

type DailyPoint = {
  date: string;
  amount: number;
};

type RevenueResponse = {
  todayRevenue: number;
  todayOrders: number;
  weeklyRevenue: number;
  totalRevenue: number;
  bestSellingItem: string | null;
  dailyRevenue: DailyPoint[];
};

export default function RevenueClient() {
  const [data, setData] = useState<RevenueResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const res = await fetch("/api/analytics/revenue", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load revenue analytics");
        }
        const json = (await res.json()) as RevenueResponse;
        setData(json);
      } catch (err) {
        setError((err as Error).message || "Unable to load revenue analytics.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const dailyMax =
    data && data.dailyRevenue.length > 0
      ? Math.max(...data.dailyRevenue.map((d) => d.amount))
      : 0;

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-xs text-red-400">{error}</p>}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Today&apos;s revenue</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {isLoading ? "…" : `₹${data?.todayRevenue ?? 0}`}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total orders today</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {isLoading ? "…" : data?.todayOrders ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Weekly revenue</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {isLoading ? "…" : `₹${data?.weeklyRevenue ?? 0}`}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Total lifetime revenue</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {isLoading ? "…" : `₹${data?.totalRevenue ?? 0}`}
          </p>
          <p className="mt-3 text-xs text-zinc-400">
            Best selling item:{" "}
            <span className="font-medium text-zinc-100">
              {isLoading ? "…" : data?.bestSellingItem ?? "N/A"}
            </span>
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Last 7 days revenue
          </p>
          <p className="text-[11px] text-zinc-500">
            {data?.dailyRevenue.length ?? 0} days
          </p>
        </div>
        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading chart…</p>
        ) : !data || data.dailyRevenue.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No orders in the last week. Once orders are placed, a simple revenue chart will appear
            here.
          </p>
        ) : (
          <div className="flex items-end gap-2 overflow-x-auto pb-1">
            {data.dailyRevenue.map((point) => {
              const height =
                dailyMax > 0 ? Math.max(10, (point.amount / dailyMax) * 80) : 10;
              const label = new Date(point.date).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
              });
              return (
                <div
                  key={point.date}
                  className="flex flex-col items-center justify-end gap-1 text-[10px] text-zinc-400"
                >
                  <div
                    className="w-7 rounded-md bg-gradient-to-t from-amber-400 to-amber-200"
                    style={{ height: `${height}px` }}
                  />
                  <span>{label}</span>
                  <span className="text-[9px] text-zinc-500">₹{point.amount}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

