"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { getOrderStatusLabel } from "@/lib/order-status";

const FUNNY_STATUS_MESSAGES = [
  "Don’t sleep 😴",
  "Your Maggi smells amazing 😋",
  "Roommate alert 🚨 hide your bowl",
  "BTM hunger detected. Bowl incoming 🕵️‍♂️",
  "Hydrate while you wait 💧",
  "If you hear footsteps… it’s your Maggi 👣",
] as const;

const STATUS_STEPS = [
  "PLACED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

type OrderStatusType = (typeof STATUS_STEPS)[number];

const STEP_CONFIG: Record<
  OrderStatusType,
  { label: string; description: string; eta?: string }
> = {
  PLACED: {
    label: getOrderStatusLabel("PLACED"),
    description: "We've received your order.",
    eta: "~10 min",
  },
  PREPARING: {
    label: getOrderStatusLabel("PREPARING"),
    description: "We're cooking your Maggi.",
    eta: "~8 min",
  },
  OUT_FOR_DELIVERY: {
    label: getOrderStatusLabel("OUT_FOR_DELIVERY"),
    description: "On the way to you.",
    eta: "~5 min",
  },
  DELIVERED: {
    label: getOrderStatusLabel("DELIVERED"),
    description: "Enjoy your Maggi!",
  },
};

type OrderItem = {
  id: string;
  dishId: string;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  status: OrderStatusType | "CANCELLED";
  totalAmount: number;
  address: string;
  createdAt: string;
  items: OrderItem[];
};

function statusIndex(status: string): number {
  const i = STATUS_STEPS.indexOf(status as OrderStatusType);
  return i === -1 ? 0 : i;
}

function shortOrderId(id: string): string {
  return id.length >= 8 ? id.slice(-8).toUpperCase() : id.toUpperCase();
}

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = typeof params?.id === "string" ? params.id : null;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);
  const [funnyMessage, setFunnyMessage] = useState<string>("");
  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    const pick =
      FUNNY_STATUS_MESSAGES[
        Math.floor(Math.random() * FUNNY_STATUS_MESSAGES.length)
      ];
    setFunnyMessage(pick);
  }, []);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrder = async () => {
      try {
        setError(null);
        const res = await fetch(`/api/orders/track/${orderId}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (res.status === 404) setError("Order not found.");
          else if (res.status === 403) setError("You don't have access to this order.");
          else setError("Failed to load order.");
          setOrder(null);
          return;
        }
        const data = (await res.json()) as Order;
        setOrder(data);

        if (prevStatusRef.current !== null && prevStatusRef.current !== data.status) {
          const config = STEP_CONFIG[data.status as OrderStatusType];
          setStatusToast(config?.label ?? data.status);
          setTimeout(() => setStatusToast(null), 4000);
        }
        prevStatusRef.current = data.status;
      } catch {
        setError("Failed to load order.");
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };

    void fetchOrder();
    const interval = setInterval(fetchOrder, 12_000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading && !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        <p>Loading order…</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-4 text-zinc-50">
        <p className="text-red-400">{error ?? "Order not found."}</p>
        <Link
          href="/"
          className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-300"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  const currentStep = statusIndex(order.status);
  const isDelivered = order.status === "DELIVERED";
  const isCancelled = order.status === "CANCELLED";
  const orderTime = new Date(order.createdAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    hour12: true,
  });

  if (isCancelled) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black px-4 text-zinc-50">
        <p className="text-zinc-400">This order was cancelled.</p>
        <Link
          href="/"
          className="rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-black hover:bg-amber-300"
        >
          Back to Home
        </Link>
      </main>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-black px-4 py-6 text-zinc-50 sm:px-6 sm:py-8"
    >
      <div className="mx-auto max-w-lg">
        <AnimatePresence>
          {statusToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/40 px-4 py-2.5 text-center text-sm text-amber-200"
            >
              Status updated: {statusToast}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Track order
          </h1>
          <Link
            href="/"
            className="text-sm text-amber-400 hover:text-amber-300"
          >
            ← Home
          </Link>
        </div>

        {/* Stepper */}
        <section className="ui-card mb-8 border border-zinc-800 bg-zinc-950/60 p-5 sm:p-6">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Order status
          </h2>
          {funnyMessage && (
            <p className="mb-4 text-sm text-zinc-300">
              {funnyMessage}
            </p>
          )}
          <div className="relative">
            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-zinc-800" />
            <div
              className="absolute left-4 top-4 w-0.5 bg-amber-400/70 transition-all duration-500 ease-out"
              style={{
                height:
                  currentStep >= STATUS_STEPS.length - 1
                    ? "100%"
                    : `${(currentStep / (STATUS_STEPS.length - 1)) * 100}%`,
              }}
            />
            <ul className="relative flex flex-col gap-0">
              {STATUS_STEPS.map((step, i) => {
                const isCompleted = i <= currentStep;
                const isCurrent = i === currentStep;
                const config = STEP_CONFIG[step as OrderStatusType];
                return (
                  <li key={step} className="flex items-start gap-4 pb-6 last:pb-0">
                    <motion.div
                      className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${
                        isCompleted
                          ? "border-amber-400 bg-amber-400 text-black"
                          : "border-zinc-700 bg-zinc-900 text-zinc-500"
                      } ${isCurrent ? "ring-2 ring-amber-400/50 ring-offset-2 ring-offset-zinc-950" : ""}`}
                      animate={isCurrent ? { scale: [1, 1.1, 1] } : undefined}
                      transition={
                        isCurrent
                          ? { duration: 1, repeat: Infinity, repeatType: "loop", ease: "easeInOut" }
                          : undefined
                      }
                    >
                      {isCompleted && i < currentStep ? "✓" : i + 1}
                    </motion.div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p
                        className={`font-medium ${
                          isCurrent ? "text-amber-300" : isCompleted ? "text-zinc-200" : "text-zinc-500"
                        }`}
                      >
                        {config?.label ?? step.replace(/_/g, " ")}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500">
                        {config?.description}
                      </p>
                      {isCurrent && config?.eta && (
                        <p className="mt-1 text-xs text-amber-400/90">
                          Est. {config.eta}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Order details card */}
        <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 sm:p-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Order details
          </h2>
          <p className="mb-1 text-xs text-zinc-500">
            Order ID <span className="font-mono text-zinc-400">{shortOrderId(order.id)}</span>
          </p>
          <p className="mb-4 text-xs text-zinc-500">Placed at {orderTime}</p>

          <div className="mb-4 space-y-2">
            <p className="text-xs font-medium text-zinc-400">Items</p>
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between text-sm">
                  <span className="text-zinc-300">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-amber-300">₹{item.price * item.quantity}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4 border-t border-zinc-800 pt-3">
            <div className="flex justify-between text-sm font-semibold text-zinc-50">
              <span>Total</span>
              <span className="text-amber-300">₹{order.totalAmount}</span>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-zinc-400">Delivery address</p>
            <p className="text-sm text-zinc-200 whitespace-pre-wrap">{order.address}</p>
          </div>
        </section>

        {isDelivered && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-950/30 p-5 text-center"
          >
            <p className="mb-4 font-medium text-amber-200">Enjoy your Maggi!</p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-400/25 transition hover:bg-amber-300"
            >
              Order again
            </Link>
          </motion.div>
        )}

        <p className="text-center text-xs text-zinc-500">
          Status updates every 12 seconds
        </p>
      </div>
    </motion.main>
  );
}
