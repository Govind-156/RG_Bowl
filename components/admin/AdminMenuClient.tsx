"use client";

import { useEffect, useState, useCallback } from "react";

type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  category: string;
  isAvailable: boolean;
  createdAt: string;
};

type Notification = {
  type: "success" | "error";
  message: string;
};

const emptyForm: Omit<Dish, "id" | "createdAt"> = {
  name: "",
  description: "",
  price: 0,
  image: null,
  category: "",
  isAvailable: true,
};

export default function AdminMenuClient() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | "new" | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<Dish, "id" | "createdAt">>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = useCallback((type: "success" | "error", message: string) => {
    setNotification({ type, message });
    const t = setTimeout(() => setNotification(null), 5000);
    return () => clearTimeout(t);
  }, []);

  const loadMenu = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dishes", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to load dishes");
      }
      const data = (await res.json()) as Dish[];
      setDishes(data);
    } catch (err) {
      showNotification("error", (err as Error).message || "Unable to load dishes.");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    void loadMenu();
  }, [loadMenu]);

  const startCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const startEdit = (item: Dish) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      image: item.image,
      category: item.category,
      isAvailable: item.isAvailable,
    });
  };

  const handleChange = (field: keyof Omit<Dish, "id" | "createdAt">, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value } as Omit<Dish, "id" | "createdAt">));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      image: form.image || null,
      category: form.category,
      isAvailable: form.isAvailable,
    };

    try {
      setSavingId(editingId ?? "new");
      setNotification(null);

      if (editingId === null) {
        const res = await fetch("/api/admin/dishes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error || data.details?.name?.[0] || data.details?.category?.[0] || "Failed to create dish",
          );
        }
        showNotification("success", "Dish added successfully.");
      } else {
        const res = await fetch(`/api/admin/dishes/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error || data.details?.name?.[0] || data.details?.category?.[0] || "Failed to update dish",
          );
        }
        showNotification("success", "Dish updated successfully.");
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadMenu();
    } catch (err) {
      showNotification("error", (err as Error).message || "Unable to save dish.");
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleAvailability = async (id: string, value: boolean) => {
    try {
      setSavingId(id);
      setNotification(null);
      const res = await fetch(`/api/admin/dishes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isAvailable: value }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to update availability");
      }
      showNotification("success", value ? "Dish is now visible on the menu." : "Dish is now hidden.");
      await loadMenu();
    } catch (err) {
      showNotification("error", (err as Error).message || "Unable to update availability.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this dish? This cannot be undone.")) return;
    try {
      setDeletingId(id);
      setNotification(null);
      const res = await fetch(`/api/admin/dishes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to delete dish");
      }
      showNotification("success", "Dish deleted.");
      if (editingId === id) {
        setForm(emptyForm);
        setEditingId(null);
      }
      await loadMenu();
    } catch (err) {
      showNotification("error", (err as Error).message || "Unable to delete dish.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      {notification && (
        <div
          role="alert"
          className={`rounded-xl border px-4 py-3 text-sm font-medium ${
            notification.type === "success"
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/50 bg-red-500/10 text-red-300"
          }`}
        >
          {notification.message}
        </div>
      )}

      <header className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Menu management</h1>
          <p className="text-sm text-zinc-400">
            Add, edit, and toggle availability for all RG Bowl dishes.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-black shadow-md shadow-amber-400/30 transition hover:bg-amber-300"
        >
          Add dish
        </button>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        {loading ? (
          <p className="text-sm text-zinc-400">Loading dishes…</p>
        ) : dishes.length === 0 ? (
          <p className="text-sm text-zinc-400">
            No dishes yet. Use &quot;Add dish&quot; to create your first item.
          </p>
        ) : (
          <div className="space-y-3">
            {dishes.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-3 text-xs sm:text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-zinc-50">{item.name}</span>
                    <p className="text-[11px] text-zinc-400 sm:text-xs">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-amber-300">₹{item.price}</p>
                    <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-400">
                      {item.category}
                    </span>
                    <div className="mt-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          item.isAvailable
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {item.isAvailable ? "Visible on menu" : "Hidden"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-1 text-[11px] text-zinc-300">
                    <input
                      type="checkbox"
                      checked={item.isAvailable}
                      disabled={savingId === item.id}
                      onChange={(e) =>
                        void handleToggleAvailability(item.id, e.target.checked)
                      }
                      className="h-3 w-3 rounded border-zinc-600 bg-zinc-900 text-amber-400 focus:ring-amber-400"
                    />
                    <span>Show on public menu</span>
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="rounded-full border border-zinc-700 px-3 py-1 text-zinc-200 hover:bg-zinc-800"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="rounded-full border border-red-500/40 px-3 py-1 text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500"
                    >
                      {deletingId === item.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <h2 className="mb-3 text-sm font-semibold tracking-tight text-zinc-50 sm:text-base">
          {editingId === null ? "Add new dish" : "Edit dish"}
        </h2>
        <form
          className="grid gap-3 text-xs sm:grid-cols-2 sm:text-sm"
          onSubmit={handleSubmit}
        >
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-zinc-300 sm:text-xs" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              type="text"
              required
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400 sm:text-sm"
              placeholder="Classic Maggi"
            />
          </div>
          <div className="space-y-1">
            <label
              className="block text-[11px] font-medium text-zinc-300 sm:text-xs"
              htmlFor="price"
            >
              Price (₹)
            </label>
            <input
              id="price"
              type="number"
              min={1}
              required
              value={form.price || ""}
              onChange={(e) => handleChange("price", Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400 sm:text-sm"
              placeholder="99"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label
              className="block text-[11px] font-medium text-zinc-300 sm:text-xs"
              htmlFor="category"
            >
              Category
            </label>
            <input
              id="category"
              type="text"
              required
              value={form.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400 sm:text-sm"
              placeholder="e.g. Maggi, Snacks"
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label
              className="block text-[11px] font-medium text-zinc-300 sm:text-xs"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              id="description"
              required
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              className="h-20 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400 sm:text-sm"
              placeholder="Short description for this dish."
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label
              className="block text-[11px] font-medium text-zinc-300 sm:text-xs"
              htmlFor="image"
            >
              Image URL (optional)
            </label>
            <input
              id="image"
              type="text"
              value={form.image ?? ""}
              onChange={(e) =>
                handleChange("image", e.target.value.trim() || null)
              }
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400 sm:text-sm"
              placeholder="https://..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-center gap-1 text-[11px] text-zinc-300 sm:text-xs">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => handleChange("isAvailable", e.target.checked)}
                className="h-3 w-3 rounded border-zinc-600 bg-zinc-900 text-amber-400 focus:ring-amber-400"
              />
              <span>Show on public menu</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={savingId !== null}
              className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-black shadow-md shadow-amber-400/30 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              {savingId === null
                ? editingId === null
                  ? "Create dish"
                  : "Save changes"
                : "Saving…"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
