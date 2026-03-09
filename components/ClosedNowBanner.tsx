"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Settings = {
  isOrderingPaused: boolean;
  pauseReason: string | null;
  operatingHours?: string;
};

export default function ClosedNowBanner() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchSettings() {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as Settings;
        if (!cancelled) setSettings(data);
      } catch {
        if (!cancelled) setSettings(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSettings();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !settings?.isOrderingPaused) return null;

  const message =
    settings.pauseReason?.trim() ||
    "We’re closed right now. Check back during our operating hours to place your order.";

  return (
    <AnimatePresence>
      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full overflow-hidden border-b border-amber-500/20 bg-gradient-to-b from-amber-950/40 via-zinc-950 to-zinc-950"
        aria-live="polite"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(251,191,36,0.06),transparent)]" aria-hidden />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:gap-8 sm:px-6 sm:py-12">
          {/* "Oops we're closed" illustration */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.35 }}
            className="flex-shrink-0"
          >
            <motion.div
              className="relative h-32 w-40 sm:h-36 sm:w-44"
              animate={{ rotate: [0, -2, 2, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg
                viewBox="0 0 160 144"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full text-amber-400/90"
                aria-hidden
              >
                {/* Hanging "closed" sign */}
                <path d="M80 16 L80 28" stroke="currentColor" strokeWidth="2" strokeOpacity="0.35" strokeLinecap="round" />
                <rect x="40" y="28" width="80" height="56" rx="6" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2" strokeOpacity="0.45" />
                <rect x="52" y="42" width="56" height="28" rx="4" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.4" />
                <path d="M62 56 L98 56 M62 64 L98 64 M62 72 L90 72" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" strokeLinecap="round" />
                {/* Moon */}
                <circle cx="118" cy="44" r="10" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
                <circle cx="114" cy="40" r="2.5" fill="currentColor" fillOpacity="0.3" />
                {/* Bowl silhouette */}
                <ellipse cx="80" cy="112" rx="28" ry="7" fill="currentColor" fillOpacity="0.06" stroke="currentColor" strokeWidth="1" strokeOpacity="0.25" />
              </svg>
            </motion.div>
          </motion.div>

          <div className="flex flex-1 flex-col items-center text-center sm:items-start sm:text-left">
            <motion.h2
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15, duration: 0.35 }}
              className="mb-2 text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl"
            >
              Oops, we&apos;re closed now
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, duration: 0.35 }}
              className="text-sm leading-relaxed text-zinc-400 sm:text-base"
            >
              {message}
            </motion.p>
            {settings.operatingHours && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="mt-2 text-xs text-amber-400/90"
              >
                We&apos;re usually open {settings.operatingHours}
              </motion.p>
            )}
          </div>
        </div>
      </motion.section>
    </AnimatePresence>
  );
}
