"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type DailyPoint = {
  date: string;
  amount: number;
};

type AnalyticsData = {
  todayRevenue: number;
  todayOrders: number;
  weeklyRevenue: number;
  bestSellingDish: string | null;
  dailyRevenue: DailyPoint[];
};

export default function AnalyticsClient() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const res = await fetch("/api/admin/analytics", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load analytics");
        const json = (await res.json()) as AnalyticsData;
        setData(json);
      } catch (err) {
        setError((err as Error).message || "Unable to load analytics.");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  const chartData =
    data?.dailyRevenue.map((d) => ({
      date: new Date(d.date).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
      revenue: d.amount,
    })) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Today&apos;s revenue
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {isLoading ? "…" : `₹${data?.todayRevenue ?? 0}`}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Total orders today
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {isLoading ? "…" : data?.todayOrders ?? 0}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Weekly revenue
          </p>
          <p className="mt-2 text-2xl font-semibold text-zinc-50">
            {isLoading ? "…" : `₹${data?.weeklyRevenue ?? 0}`}
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Best selling dish
          </p>
          <p className="mt-2 text-xl font-semibold text-amber-300">
            {isLoading ? "…" : data?.bestSellingDish ?? "—"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Revenue (last 7 days)
        </h2>
        {isLoading ? (
          <div className="flex h-64 items-center justify-center text-zinc-500">
            Loading chart…
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
            No orders in the last 7 days.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#27272a"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={{ stroke: "#3f3f46" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#a1a1aa", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #3f3f46",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#a1a1aa" }}
                  formatter={(value: number) => [`₹${value}`, "Revenue"]}
                  labelFormatter={(label) => label}
                />
                <Bar
                  dataKey="revenue"
                  fill="#fbbf24"
                  radius={[4, 4, 0, 0]}
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>
    </div>
  );
}
