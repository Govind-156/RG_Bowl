"use client";

import { useEffect, useState } from "react";

const ORDER_STATUSES = [
  "PLACED",
  "PREPARING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

type OrderStatus = (typeof ORDER_STATUSES)[number];

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};
type DeliveryPartner = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

type Order = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  totalAmount: number;
  createdAt: string;
  paymentId: string;
  status: OrderStatus;
  deliveryPartner?: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
};

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  PLACED:
    "bg-amber-500/20 text-amber-300 border-amber-500/40",
  PREPARING:
    "bg-blue-500/20 text-blue-300 border-blue-500/40",
  OUT_FOR_DELIVERY:
    "bg-violet-500/20 text-violet-300 border-violet-500/40",
  DELIVERED:
    "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  CANCELLED:
    "bg-red-500/20 text-red-300 border-red-500/40",
};

let audioContext: AudioContext | null = null;
let isPlayingChime = false;

async function playNewOrderSound() {
  try {
    type WindowWithAudioContext = Window & {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const w = window as WindowWithAudioContext;
    const AudioCtx = w.AudioContext ?? w.webkitAudioContext;
    if (!AudioCtx || isPlayingChime) return;

    if (!audioContext) {
      audioContext = new AudioCtx();
    }

    const ctx = audioContext;
    const now = ctx.currentTime;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc1.connect(gain);

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now + 0.35);
    osc2.connect(gain);

    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
    gain.gain.setValueAtTime(0.3, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    isPlayingChime = true;

    osc1.start(now);
    osc1.stop(now + 0.4);

    osc2.start(now + 0.35);
    osc2.stop(now + 0.75);

    const reset = () => {
      isPlayingChime = false;
      gain.disconnect();
    };

    osc2.onended = reset;
  } catch {
    isPlayingChime = false;
  }
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newOrderIds, setNewOrderIds] = useState<string[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);

  const fetchOrders = async (isInitial = false) => {
    try {
      if (!isInitial) setError(null);
      const prevIds = new Set(orders.map((o) => o.id));

      const res = await fetch("/api/orders", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch orders");

      const data = (await res.json()) as Order[];
      setOrders(data);

      const freshIds = data.map((o) => o.id);
      const newOnes = freshIds.filter((id) => !prevIds.has(id));

      if (newOnes.length > 0) {
        setNewOrderIds(newOnes);
        if (soundEnabled && !isInitial) void playNewOrderSound();
        setTimeout(() => {
          setNewOrderIds((current) => current.filter((id) => !newOnes.includes(id)));
        }, 8000);
      }
    } catch (err) {
      setError((err as Error).message || "Unable to load orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchOrders(true);
    const interval = setInterval(() => void fetchOrders(), 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadPartners = async () => {
      try {
        const res = await fetch("/api/admin/delivery-partners", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as DeliveryPartner[];
        setDeliveryPartners(data);
      } catch {
        // non-fatal
      }
    };
    void loadPartners();
  }, []);

  const handleAssignDeliveryPartner = async (id: string, deliveryPartnerId: string) => {
    try {
      setUpdatingId(id);
      setError(null);

      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryPartnerId }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        throw new Error(data?.error || data?.message || "Failed to assign delivery partner");
      }

      const updated = (await res.json()) as Order;
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      setError((err as Error).message || "Unable to assign delivery partner.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      setUpdatingId(id);
      setError(null);

      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
        throw new Error(data?.error || data?.message || "Failed to update status");
      }

      const updated = (await res.json()) as Order;
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    } catch (err) {
      setError((err as Error).message || "Unable to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this order? This cannot be undone.")) return;
    try {
      setDeletingId(id);
      setError(null);
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete order");
      setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      setError((err as Error).message || "Unable to delete order.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-xs text-zinc-400 sm:text-sm">
          Live order feed. Auto-refreshes every 10 seconds.
        </p>
        <button
          type="button"
          onClick={() => setSoundEnabled((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-zinc-700 px-3 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800"
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              soundEnabled ? "bg-emerald-400" : "bg-zinc-500"
            }`}
          />
          Sound {soundEnabled ? "on" : "off"}
        </button>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 sm:p-4">
        {isLoading ? (
          <p className="text-sm text-zinc-400">Loading orders…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No orders yet. New orders will appear here in real time.
          </p>
        ) : (
          <div className="space-y-3">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex flex-col gap-3">
              {orders.map((order) => {
                const isNew = newOrderIds.includes(order.id);
                const orderTime = new Date(order.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  hour12: true,
                });
                const itemsSummary =
                  order.items.length > 0
                    ? order.items
                        .map((i) => `${i.name} × ${i.quantity}`)
                        .join(", ")
                    : "No items";
                const assignedId = order.deliveryPartner?.id ?? "";

                return (
                  <div
                    key={order.id}
                    className={`flex flex-col gap-3 rounded-xl border px-3 py-3 text-xs sm:px-4 sm:py-4 sm:text-sm ${
                      isNew
                        ? "border-amber-400/80 bg-amber-400/5"
                        : "border-zinc-800 bg-zinc-900/80"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 font-mono text-[10px] text-zinc-300">
                          #{order.id.slice(-8)}
                        </span>
                        <span className="font-medium text-zinc-50">
                          {order.customerName}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE_CLASS[order.status]}`}
                        >
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400">{orderTime}</span>
                    </div>

                    <div className="grid gap-1.5 text-[11px] text-zinc-300 sm:grid-cols-2">
                      <p>
                        <span className="text-zinc-500">Phone:</span> {order.phone}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="text-zinc-500">Address:</span>{" "}
                        <span className="text-zinc-200">{order.address}</span>
                      </p>
                      <p className="sm:col-span-2">
                        <span className="text-zinc-500">Items:</span> {itemsSummary}
                      </p>
                      {deliveryPartners.length > 0 && (
                        <div className="sm:col-span-2 mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-zinc-500">Delivery partner:</span>
                          <select
                            value={assignedId}
                            onChange={(e) =>
                              e.target.value &&
                              handleAssignDeliveryPartner(order.id, e.target.value)
                            }
                            className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-100"
                            disabled={updatingId === order.id}
                          >
                            <option value="">Unassigned</option>
                            {deliveryPartners.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name || p.email}
                              </option>
                            ))}
                          </select>
                          {order.deliveryPartner?.phone && (
                            <span className="text-[10px] text-zinc-500">
                              ({order.deliveryPartner.phone})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-2">
                      <div className="flex flex-wrap items-center gap-3 text-[11px]">
                        <span className="font-semibold text-amber-300">
                          ₹{order.totalAmount}
                        </span>
                        <span className="text-zinc-500">
                          Payment:{" "}
                          <span className="font-mono text-[10px] text-zinc-400">
                            {order.paymentId.slice(0, 12)}…
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={order.status}
                          onChange={(e) =>
                            handleStatusChange(order.id, e.target.value as OrderStatus)
                          }
                          disabled={updatingId === order.id}
                          className="rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] text-zinc-100 outline-none focus:border-amber-400"
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace(/_/g, " ")}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDelete(order.id)}
                          disabled={deletingId === order.id}
                          className="rounded-full border border-red-500/40 px-2.5 py-1.5 text-[11px] text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500"
                        >
                          {deletingId === order.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
