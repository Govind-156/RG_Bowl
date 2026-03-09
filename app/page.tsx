"use client";

import { motion } from "framer-motion";
import MenuSection from "@/components/menu/MenuSection";
import CartDrawer from "@/components/cart/CartPlaceholder";
import CheckoutPlaceholder from "@/components/checkout/CheckoutPlaceholder";

export default function Home() {
  const scrollToMenu = () => {
    const el = document.getElementById("menu-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-x-hidden">
      {/* Gradient hero background - mobile-first */}
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
            Hot Maggi under 30 minutes.
          </h1>
          <p className="mb-5 text-lg font-semibold text-amber-400 sm:text-xl md:text-2xl">
            Not Quick. But Quality.
          </p>
          <motion.p
            className="mb-8 text-sm leading-relaxed text-zinc-400 sm:text-base md:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            Fresh comfort bowls made when you order. Built for late-night cravings in BTM, where
            good food is worth the wait.
          </motion.p>
          <motion.div
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.button
              type="button"
              onClick={scrollToMenu}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-400 px-8 py-3.5 text-sm font-semibold text-black shadow-xl shadow-amber-400/25 transition-shadow hover:shadow-amber-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
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

      <CartDrawer />
    </main>
  );
}
