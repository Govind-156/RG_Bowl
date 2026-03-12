"use client";

import { useEffect, useState } from "react";

type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderValue: number | null;
  firstOrderOnly: boolean;
  maxDiscount: number | null;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  createdAt: string;
};

const COUPON_TYPES = [
  { value: "PERCENT_DISCOUNT", label: "Percent off" },
  { value: "FREE_DELIVERY", label: "Free delivery" },
  { value: "FIXED_OFF", label: "Fixed amount off" },
] as const;

export default function AdminCouponsClient() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createCode, setCreateCode] = useState("");
  const [createType, setCreateType] = useState<"PERCENT_DISCOUNT" | "FREE_DELIVERY" | "FIXED_OFF">("PERCENT_DISCOUNT");
  const [createValue, setCreateValue] = useState(25);
  const [createMinOrder, setCreateMinOrder] = useState(0);
  const [createFirstOrderOnly, setCreateFirstOrderOnly] = useState(false);
  const [createMaxDiscount, setCreateMaxDiscount] = useState<number | "">("");
  const [createValidTo, setCreateValidTo] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadCoupons = async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/coupons", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to load coupons");
      }
      const data = (await res.json()) as Coupon[];
      setCoupons(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCoupons();
  }, []);

  const defaultValidTo = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 16);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = createCode.trim().toUpperCase();
    if (!code) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          code,
          type: createType,
          value: createType === "FREE_DELIVERY" ? 0 : createValue,
          minOrderValue: createMinOrder || undefined,
          firstOrderOnly: createFirstOrderOnly,
          maxDiscount: createType === "PERCENT_DISCOUNT" && createMaxDiscount !== "" ? Number(createMaxDiscount) : undefined,
          validTo: createValidTo || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          isActive: true,
        }),
      });
      const data = (await res.json()) as { error?: string } | Coupon;
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || "Failed to create coupon");
      }
      setCoupons((prev) => [data as Coupon, ...prev]);
      setCreateCode("");
      setCreateValue(25);
      setCreateMinOrder(0);
      setCreateFirstOrderOnly(false);
      setCreateMaxDiscount("");
      setCreateValidTo("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to delete coupon");
      }
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Coupons</h1>
        <p className="text-sm text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Coupons</h1>
        <p className="text-sm text-zinc-400">
          Create and manage discount and free-delivery coupons. Customers enter the code at checkout.
        </p>
      </header>

      {error && (
        <p className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Create coupon
        </h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Code</label>
              <input
                type="text"
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                placeholder="e.g. FIRST25"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Type</label>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value as typeof createType)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
              >
                {COUPON_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {createType !== "FREE_DELIVERY" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">
                  {createType === "PERCENT_DISCOUNT" ? "Percent off (1–100)" : "Amount off (₹)"}
                </label>
                <input
                  type="number"
                  min={createType === "PERCENT_DISCOUNT" ? 1 : 0}
                  max={createType === "PERCENT_DISCOUNT" ? 100 : undefined}
                  value={createValue}
                  onChange={(e) => setCreateValue(Number(e.target.value) || 0)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Min order (₹)</label>
              <input
                type="number"
                min={0}
                value={createMinOrder}
                onChange={(e) => setCreateMinOrder(Number(e.target.value) || 0)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
          {createType === "PERCENT_DISCOUNT" && (
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Max discount cap (₹, optional)</label>
              <input
                type="number"
                min={0}
                value={createMaxDiscount}
                onChange={(e) => setCreateMaxDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="No cap"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
              />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={createFirstOrderOnly}
                onChange={(e) => setCreateFirstOrderOnly(e.target.checked)}
                className="rounded border-zinc-600 bg-zinc-800 text-amber-400 focus:ring-amber-400"
              />
              First order only
            </label>
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-400">Valid until</label>
              <input
                type="datetime-local"
                value={createValidTo}
                onChange={(e) => setCreateValidTo(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                placeholder={defaultValidTo()}
                className="w-full max-w-xs rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={creating}
            className="w-fit rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-amber-400 disabled:opacity-50"
          >
            {creating ? "Creating…" : "Create coupon"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
          All coupons
        </h2>
        {coupons.length === 0 ? (
          <p className="text-sm text-zinc-500">No coupons yet. Create one above.</p>
        ) : (
          <ul className="space-y-3">
            {coupons.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-sm"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono font-semibold text-amber-300">{c.code}</span>
                  <span className="text-zinc-400">
                    {c.type === "PERCENT_DISCOUNT" && `${c.value}% off`}
                    {c.type === "FREE_DELIVERY" && "Free delivery"}
                    {c.type === "FIXED_OFF" && `₹${c.value} off`}
                  </span>
                  {c.minOrderValue != null && c.minOrderValue > 0 && (
                    <span className="text-zinc-500">Min ₹{c.minOrderValue}</span>
                  )}
                  {c.firstOrderOnly && (
                    <span className="rounded bg-zinc-700 px-1.5 py-0.5 text-xs text-zinc-400">
                      First order
                    </span>
                  )}
                  {!c.isActive && (
                    <span className="rounded bg-red-900/40 px-1.5 py-0.5 text-xs text-red-400">
                      Inactive
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="rounded border border-red-800/60 bg-red-950/40 px-3 py-1.5 text-xs text-red-400 hover:bg-red-950/60 disabled:opacity-50"
                >
                  {deletingId === c.id ? "Deleting…" : "Delete"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
