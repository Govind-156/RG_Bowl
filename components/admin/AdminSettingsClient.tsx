"use client";

import { useEffect, useState } from "react";

type Settings = {
  id: number;
  operatingHours: string;
  isOrderingPaused: boolean;
  pauseReason: string | null;
};

export default function AdminSettingsClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadSettings = async () => {
    try {
      setError(null);
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to load settings");
      }
      const data = (await res.json()) as Settings;
      setSettings(data);
    } catch (err) {
      setError((err as Error).message || "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const handleChange = (field: keyof Settings, value: unknown) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value } as Settings);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          operatingHours: settings.operatingHours,
          isOrderingPaused: settings.isOrderingPaused,
          pauseReason: settings.pauseReason,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to update settings");
      }
      const data = (await res.json()) as Settings;
      setSettings(data);
    } catch (err) {
      setError((err as Error).message || "Unable to update settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-zinc-400">
          Control operating hours and temporarily pause new orders when needed.
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        {error && <p className="mb-3 text-xs text-red-400 sm:text-sm">{error}</p>}
        {loading || !settings ? (
          <p className="text-sm text-zinc-400">Loading settings…</p>
        ) : (
          <form className="space-y-4 text-xs sm:text-sm" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label
                htmlFor="operatingHours"
                className="block text-[11px] font-medium text-zinc-300 sm:text-xs"
              >
                Operating hours
              </label>
              <input
                id="operatingHours"
                type="text"
                value={settings.operatingHours}
                onChange={(e) => handleChange("operatingHours", e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-amber-400 sm:text-sm"
                placeholder="e.g. 19:00-03:00"
              />
              <p className="text-[11px] text-zinc-500 sm:text-xs">
                This is currently informational only and shown to admins; you can later wire it into
                time-based order blocking.
              </p>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[11px] text-zinc-300 sm:text-xs">
                <input
                  type="checkbox"
                  checked={settings.isOrderingPaused}
                  onChange={(e) => handleChange("isOrderingPaused", e.target.checked)}
                  className="h-3 w-3 rounded border-zinc-600 bg-zinc-900 text-amber-400 focus:ring-amber-400"
                />
                <span>Pause new orders</span>
              </label>
              <p className="text-[11px] text-zinc-500 sm:text-xs">
                When enabled, checkout will be blocked and users will see a message.
              </p>
            </div>

            {settings.isOrderingPaused && (
              <div className="space-y-1">
                <label
                  htmlFor="pauseReason"
                  className="block text-[11px] font-medium text-zinc-300 sm:text-xs"
                >
                  Pause message (optional)
                </label>
                <textarea
                  id="pauseReason"
                  value={settings.pauseReason ?? ""}
                  onChange={(e) => handleChange("pauseReason", e.target.value)}
                  className="h-20 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 outline-none ring-0 placeholder:text-zinc-500 focus:border-amber-400 sm:text-sm"
                  placeholder="e.g. We are taking a short break due to heavy rain. Orders will reopen soon."
                />
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-black shadow-md shadow-amber-400/30 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}

