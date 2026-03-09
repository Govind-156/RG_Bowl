"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

type SummaryItem = {
  id: string;
  name: string;
  quantity: number;
};

type OrderSummary = {
  items: SummaryItem[];
  totalAmount: number;
};

function parseSummaryParam(param: string | null): OrderSummary | null {
  if (!param) return null;
  try {
    const decoded = decodeURIComponent(param);
    const parsed = JSON.parse(decoded) as OrderSummary;
    if (!Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function formatOrderTime(placedParam: string | null): string {
  if (!placedParam) return "just now";
  try {
    const ts = parseInt(placedParam, 10);
    if (Number.isNaN(ts)) return "just now";
    const d = new Date(ts);
    return d.toLocaleString("en-IN", {
      timeStyle: "short",
      hour12: true,
    });
  } catch {
    return "just now";
  }
}

/** Last 8 chars of order ID for display. */
function shortOrderId(orderId: string | null): string {
  if (!orderId || orderId.length < 8) return orderId ?? "—";
  return orderId.slice(-8).toUpperCase();
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const rawSummary = searchParams.get("summary");
  const summary = parseSummaryParam(rawSummary);
  const orderId = searchParams.get("orderId");
  const placedAt = searchParams.get("placed");
  const orderTimeLabel = formatOrderTime(placedAt);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12 text-zinc-50 sm:px-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/90 px-6 py-8 shadow-xl"
      >
        <div className="text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            Order confirmed
          </p>
          <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Order placed
          </h1>
          {orderId && (
            <p className="mb-4 text-sm text-zinc-400">
              Order ID <span className="font-mono font-medium text-zinc-200">{shortOrderId(orderId)}</span>
              {" · "}
              <span className="text-zinc-500">{orderTimeLabel}</span>
            </p>
          )}
        </div>

        <p className="mb-6 text-center text-sm text-zinc-400">
          Freshly cooked and delivered in <span className="font-semibold text-amber-300">25–30 minutes</span> to
          your address in BTM 2nd Stage.
        </p>

        {summary && summary.items.length > 0 ? (
          <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-4 text-left">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Order summary
            </h2>
            <ul className="mb-3 space-y-2">
              {summary.items.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between text-sm"
                >
                  <span className="text-zinc-200">{item.name}</span>
                  <span className="text-zinc-400">×{item.quantity}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t border-zinc-800 pt-3 text-sm">
              <span className="text-zinc-400">Total paid</span>
              <span className="font-semibold text-amber-300">₹{summary.totalAmount}</span>
            </div>
          </div>
        ) : (
          <p className="mb-6 text-center text-xs text-zinc-500 sm:text-sm">
            Your order is confirmed and being prepared.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {orderId && (
            <Link
              href={`/orders/${orderId}`}
              className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-400/25 transition hover:bg-amber-300"
            >
              Track order
            </Link>
          )}
          <Link
            href="/"
            className={
              orderId
                ? "inline-flex items-center justify-center rounded-full border border-zinc-600 bg-transparent px-6 py-3 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                : "inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-400/25 transition hover:bg-amber-300"
            }
          >
            Back to Home
          </Link>
        </div>

        {!orderId && (
          <p className="mt-4 text-center text-xs text-zinc-500">
            If you placed an order just now, you can find it in your orders or return to the menu.
          </p>
        )}
      </motion.section>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12 text-zinc-50">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-zinc-800" />
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
