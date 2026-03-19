"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
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
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");

  const shareText = `Bro I just ordered from RG Bowl 🍜🔥\nThis app is crazy 😂\nTry it: https://rgbowl.vercel.app`;

  const confettiPieces = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delayMs: Math.random() * 180,
        durationMs: 1100 + Math.random() * 650,
        rotate: Math.floor(Math.random() * 360),
        size: 6 + Math.floor(Math.random() * 6),
        color: ["#fbbf24", "#a78bfa", "#34d399", "#60a5fa", "#f472b6"][i % 5],
      })),
    [],
  );

  useEffect(() => {
    // Reduce motion support: disable confetti for users requesting reduced motion.
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12 text-zinc-50 sm:px-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="ui-card w-full max-w-md border border-zinc-800 bg-zinc-950/90 px-6 py-8 shadow-xl hover:scale-[1.03]"
      >
        {/* Confetti */}
        <div className="pointer-events-none relative -mt-2 mb-2 h-14 overflow-hidden">
          {confettiPieces.map((p) => (
            <span
              key={p.id}
              style={{
                left: `${p.left}%`,
                width: p.size,
                height: p.size * 1.6,
                backgroundColor: p.color,
                animationDelay: `${p.delayMs}ms`,
                animationDuration: `${p.durationMs}ms`,
                transform: `rotate(${p.rotate}deg)`,
              }}
              className="absolute top-0 rounded-sm opacity-0 [animation-name:confetti-fall] [animation-timing-function:ease-out] [animation-fill-mode:forwards]"
            />
          ))}
        </div>

        <div className="text-center">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
            Order confirmed
          </p>
          <h1 className="mb-2 text-2xl font-bold tracking-tight sm:text-3xl">
            🎉 Order Placed!
          </h1>
          <p className="mb-2 text-sm font-medium text-zinc-200">
            Chef is already cooking 🍜🔥
          </p>
          <p className="mb-4 text-sm text-zinc-400">
            Don’t sleep 😴 Your Maggi is coming
          </p>
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
          <button
            type="button"
            onClick={async () => {
              try {
                setShareStatus("idle");
                if (typeof navigator !== "undefined" && "share" in navigator) {
                  const nav = navigator as Navigator & { share?: (data: { text: string }) => Promise<void> };
                  if (nav.share) {
                    await nav.share({ text: shareText });
                    return;
                  }
                }
                if (navigator.clipboard?.writeText) {
                  await navigator.clipboard.writeText(shareText);
                  setShareStatus("copied");
                  setTimeout(() => setShareStatus("idle"), 2000);
                  return;
                }
                throw new Error("No share or clipboard support");
              } catch {
                setShareStatus("error");
                setTimeout(() => setShareStatus("idle"), 2500);
              }
            }}
            className="inline-flex items-center justify-center rounded-full border border-zinc-600 bg-transparent px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-800 hover:text-zinc-50"
          >
            Share with friends 😎
          </button>
          {shareStatus === "copied" && (
            <p className="text-center text-xs text-emerald-400">Copied to clipboard!</p>
          )}
          {shareStatus === "error" && (
            <p className="text-center text-xs text-red-400">Couldn’t share. Please copy manually.</p>
          )}
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

      <style jsx global>{`
        @keyframes confetti-fall {
          0% {
            opacity: 0;
            transform: translateY(-10px) rotate(0deg);
          }
          10% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(70px) rotate(360deg);
          }
        }
      `}</style>
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
