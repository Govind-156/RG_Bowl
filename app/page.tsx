"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import MenuSection from "@/components/menu/MenuSection";
import CartDrawer from "@/components/cart/CartPlaceholder";
import CheckoutPlaceholder from "@/components/checkout/CheckoutPlaceholder";

const rotatingHooks = [
  "Better than mess food 💀",
  "Assignments can wait… Maggi can’t 😭",
  "Your roommate will ask for a bite 👀",
];

export default function Home() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [notificationPopupOpen, setNotificationPopupOpen] = useState(false);
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [hookIndex, setHookIndex] = useState(0);

  function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  useEffect(() => {
    try {
      const key = "rg_bowl_home_hungry_popup_shown";
      if (sessionStorage.getItem(key) === "1") return;
      const delayMs = 5000 + Math.floor(Math.random() * 5000); // 5–10s
      const t = window.setTimeout(() => {
        sessionStorage.setItem(key, "1");
        setPopupOpen(true);
      }, delayMs);
      return () => window.clearTimeout(t);
    } catch {
      // ignore storage errors (private mode, etc.)
      const delayMs = 5000 + Math.floor(Math.random() * 5000);
      const t = window.setTimeout(() => setPopupOpen(true), delayMs);
      return () => window.clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHookIndex((prev) => (prev + 1) % rotatingHooks.length);
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    if (localStorage.getItem("rg_notifications_enabled") === "true") return;
    if (Notification.permission === "granted" || Notification.permission === "denied") return;

    const key = "rg_bowl_notification_prompt_shown";
    if (sessionStorage.getItem(key) === "1") return;

    const timer = window.setTimeout(() => {
      sessionStorage.setItem(key, "1");
      setNotificationPopupOpen(true);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, []);

  const handleEnableNotifications = async () => {
    try {
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        return;
      }
      setNotificationBusy(true);
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotificationPopupOpen(false);
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error("Missing NEXT_PUBLIC_VAPID_PUBLIC_KEY");
        setNotificationPopupOpen(false);
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));

      const res = await fetch("/api/save-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription }),
      });

      if (!res.ok) {
        throw new Error("Failed to save push subscription");
      }

      localStorage.setItem("rg_notifications_enabled", "true");
      setNotificationPopupOpen(false);
    } catch (error) {
      console.error("Notification setup failed", error);
      setNotificationPopupOpen(false);
    } finally {
      setNotificationBusy(false);
    }
  };

  const scrollToMenu = () => {
    const el = document.getElementById("menu-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative flex min-h-screen flex-col items-center overflow-x-hidden"
    >
      <AnimatePresence>
        {notificationPopupOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[85] bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setNotificationPopupOpen(false)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              className="fixed left-1/2 top-1/2 z-[90] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-5 text-zinc-50 shadow-2xl shadow-black/50"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-sm font-semibold text-amber-200">
                Get notified when your Maggi is ready 🍜?
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleEnableNotifications}
                  disabled={notificationBusy}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-400/25 transition hover:bg-amber-300 disabled:opacity-60"
                >
                  {notificationBusy ? "Please wait..." : "Allow 🔔"}
                </button>
                <button
                  type="button"
                  onClick={() => setNotificationPopupOpen(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                >
                  Not now
                </button>
              </div>
            </motion.div>
          </>
        )}
        {popupOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setPopupOpen(false)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              className="fixed left-1/2 top-1/2 z-[80] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-zinc-800 bg-zinc-950/95 p-5 text-zinc-50 shadow-2xl shadow-black/50"
              initial={{ opacity: 0, scale: 0.98, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-amber-200">
                    You look hungry 👀
                  </p>
                  <p className="text-sm text-zinc-300">
                    Order now before your roommate eats your Maggi 😭
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPopupOpen(false)}
                  className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                >
                  Close
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => {
                    setPopupOpen(false);
                    scrollToMenu();
                  }}
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-400/25 transition hover:bg-amber-300"
                >
                  Order now
                </button>
                <button
                  type="button"
                  onClick={() => setPopupOpen(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-zinc-100"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero */}
      <section className="relative flex min-h-[85vh] w-full flex-col items-center justify-center px-4 py-16 sm:min-h-[80vh] sm:px-6 sm:py-20 md:px-8">
        <div
          className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0c0a09] via-[#1c1917] to-[#09090b]"
          aria-hidden
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,191,36,0.08),transparent)]" aria-hidden />
        <div className="absolute bottom-0 left-0 right-0 h-32 -z-10 bg-gradient-to-t from-[#09090b] to-transparent" aria-hidden />

        <motion.div
          className="max-w-2xl text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-amber-400 sm:text-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            RG Bowl
          </motion.p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl md:text-6xl">
            Hot Maggi under 30 min
          </h1>
          <p className="mb-5 text-lg font-semibold text-amber-400 sm:text-xl md:text-2xl">
            Hot Maggi. Freshly made.
            <br />
            Not quick. But worth it 😌
          </p>

          <div className="mb-8 h-7">
            <AnimatePresence mode="wait">
              <motion.p
                key={rotatingHooks[hookIndex]}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="text-sm font-medium text-orange-300 sm:text-base"
              >
                {rotatingHooks[hookIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          <motion.div
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              type="button"
              onClick={scrollToMenu}
              whileHover={{ scale: 1.05, boxShadow: "0 0 18px rgba(255,165,0,0.75)" }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-8 py-3.5 text-sm font-semibold text-black transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              style={{ boxShadow: "0 0 10px rgba(255,165,0,0.5)" }}
            >
              Order Now
            </motion.button>
            <p className="max-w-xs text-center text-xs text-zinc-500 sm:text-left sm:text-sm">
              No surge pricing. Flat delivery. Just Maggi to your door.
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Menu + checkout - responsive container */}
      <section
        id="menu-section"
        className="flex w-full max-w-6xl flex-col items-center gap-6 px-4 pb-24 sm:px-6 sm:pb-28 md:px-8"
      >
        <MenuSection />
        <CheckoutPlaceholder />
      </section>

      <motion.section
        className="w-full max-w-6xl px-4 pb-14 sm:px-6 md:px-8"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45 }}
      >
        <h2 className="mb-6 text-center text-2xl font-bold text-zinc-50 sm:text-3xl">Why RG Bowl?</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            { icon: "🍜", title: "Freshly Cooked", desc: "Every bowl is made after you order." },
            { icon: "⚡", title: "Late Night Delivery", desc: "Cravings solved when most places are closed." },
            { icon: "😎", title: "Built for PG Life", desc: "Comfort food for student and hostel nights." },
          ].map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center shadow-lg shadow-black/20"
            >
              <p className="mb-2 text-3xl">{item.icon}</p>
              <h3 className="mb-1 text-lg font-semibold text-zinc-100">{item.title}</h3>
              <p className="text-sm text-zinc-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        className="w-full max-w-6xl px-4 pb-12 sm:px-6 md:px-8"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.45 }}
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-8 text-center shadow-xl shadow-black/20">
          <p className="text-xl font-semibold leading-relaxed text-zinc-100 sm:text-2xl">
            Built by interns.
            <br />
            Powered by hunger.
            <br />
            Loved by PGs.
          </p>
        </div>
      </motion.section>

      <CartDrawer />
    </motion.main>
  );
}
