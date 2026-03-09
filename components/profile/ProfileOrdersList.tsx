"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type OrderItem = {
  id: string;
  dishId: string;
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  status: string;
  totalAmount: number;
  address: string;
  createdAt: string;
  items: OrderItem[];
};

function shortOrderId(id: string): string {
  return id.length >= 8 ? id.slice(-8).toUpperCase() : id.toUpperCase();
}

function formatDate(createdAt: string): string {
  return new Date(createdAt).toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "short",
    hour12: true,
  });
}

function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export default function ProfileOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchOrders() {
      try {
        const res = await fetch("/api/me/orders", { cache: "no-store" });
        if (!res.ok) {
          if (res.status === 401) setError("Please log in to see your orders.");
          else setError("Failed to load orders.");
          return;
        }
        const data = (await res.json()) as Order[];
        if (!cancelled) setOrders(data);
      } catch {
        if (!cancelled) setError("Failed to load orders.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (loading || typeof window === "undefined") return;
    if (window.location.hash === "#orders") {
      document.getElementById("orders")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [loading]);

  if (loading) {
    return (
      <div id="orders" className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          My orders
        </h2>
        <p className="text-sm text-zinc-500">Loading orders…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div id="orders" className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          My orders
        </h2>
        <p className="text-sm text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div id="orders" className="mt-8">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        My orders
      </h2>
      {orders.length === 0 ? (
        <p className="text-sm text-zinc-500">No orders yet.</p>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs font-medium text-zinc-400">
                    #{shortOrderId(order.id)}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-medium capitalize text-zinc-300">
                    {statusLabel(order.status)}
                  </span>
                  <span className="text-sm font-semibold text-amber-300">
                    ₹{order.totalAmount}
                  </span>
                </div>
              </div>
              <Link
                href={`/orders/${order.id}`}
                className="mt-3 inline-block text-xs font-medium text-amber-400 hover:text-amber-300"
              >
                Track order →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
