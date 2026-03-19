"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type DeliveryOrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

type DeliveryOrder = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: DeliveryOrderItem[];
  totalAmount: number;
  createdAt: string;
  paymentId: string;
  status: string;
  preferredLanguage?: "KANNADA" | "HINDI" | "ENGLISH" | "TELUGU" | null;
};

export default function DeliveryDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (status === "unauthenticated" || role !== "delivery") {
      router.replace("/login?callbackUrl=/delivery");
    }
  }, [status, session?.user, router]);

  useEffect(() => {
    const fetchOrders = async (isInitial = false) => {
      try {
        if (!isInitial) setError(null);
        const res = await fetch("/api/delivery/orders", { cache: "no-store" });
        if (!res.ok) {
          throw new Error("Failed to load delivery orders");
        }
        const data = (await res.json()) as DeliveryOrder[];
        setOrders(data);
      } catch (err) {
        setError((err as Error).message || "Unable to load delivery orders.");
      } finally {
        setIsLoading(false);
      }
    };

    if (status === "authenticated") {
      void fetchOrders(true);
      const interval = setInterval(() => void fetchOrders(), 10000);
      return () => clearInterval(interval);
    }
    return () => {};
  }, [status]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        <p>Loading…</p>
      </main>
    );
  }

  const handleOpenInMaps = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleMarkDelivered = async (id: string) => {
    try {
      setUpdatingId(id);
      setError(null);
      const res = await fetch(`/api/delivery/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DELIVERED" }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        throw new Error(data.error || data.message || "Failed to update status");
      }
      // Remove order from list since it's no longer OUT_FOR_DELIVERY
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setError((err as Error).message || "Unable to update order status.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-zinc-50 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Delivery dashboard
            </h1>
            <p className="text-xs text-zinc-400 sm:text-sm">
              Orders assigned to you and marked as{" "}
              <span className="font-semibold text-amber-300">
                Delivery hero on the way 🏍️
              </span>
              .
            </p>
          </div>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 sm:p-6">
          {isLoading ? (
            <p className="text-sm text-zinc-400">Loading your orders…</p>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : orders.length === 0 ? (
            <p className="text-sm text-zinc-400">
              No active deliveries assigned to you right now.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const orderTime = new Date(order.createdAt).toLocaleTimeString(
                  "en-IN",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  },
                );
                const itemsSummary = order.items
                  .map((i) => `${i.name} × ${i.quantity}`)
                  .join(", ");
                return (
                  <article
                    key={order.id}
                    className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-3 text-xs sm:px-4 sm:py-4 sm:text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                          #{order.id.slice(-8)}
                        </span>
                        <span className="font-medium text-zinc-50">
                          {order.customerName}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Placed at {orderTime}
                      </span>
                    </div>

                    <div className="grid gap-1.5 text-[11px] text-zinc-300 sm:grid-cols-2">
                      <p>
                        <span className="text-zinc-500">Phone:</span>{" "}
                        <a
                          href={`tel:${order.phone}`}
                          className="text-amber-300 hover:underline"
                        >
                          {order.phone}
                        </a>
                      </p>
                      {order.preferredLanguage && (
                        <p className="sm:text-right">
                          <span className="text-zinc-500">Language:</span>{" "}
                          <span className="text-zinc-200">
                            {order.preferredLanguage === "KANNADA"
                              ? "Kannada"
                              : order.preferredLanguage === "HINDI"
                                ? "Hindi"
                                : order.preferredLanguage === "TELUGU"
                                  ? "Telugu"
                                  : "English"}
                          </span>
                        </p>
                      )}
                      <p className="sm:col-span-2">
                        <span className="text-zinc-500">Address:</span>{" "}
                        <span className="text-zinc-200">{order.address}</span>
                      </p>
                      <p className="sm:col-span-2">
                        <span className="text-zinc-500">Items:</span>{" "}
                        {itemsSummary}
                      </p>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-2">
                      <span className="font-semibold text-amber-300">
                        ₹{order.totalAmount}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenInMaps(order.address)}
                        className="rounded-full bg-amber-400 px-3 py-1.5 text-[11px] font-semibold text-black shadow-md shadow-amber-400/30 hover:bg-amber-300"
                      >
                        Open in Maps
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkDelivered(order.id)}
                        disabled={updatingId === order.id}
                        className="rounded-full border border-emerald-400/70 bg-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-200 shadow-md shadow-emerald-500/20 hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updatingId === order.id ? "Marking…" : "Mark as delivered"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

