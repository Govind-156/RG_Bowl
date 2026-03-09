"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCartStore } from "@/lib/cart-store";
import { useRouter } from "next/navigation";
import { DELIVERY_CHARGE } from "@/lib/constants";

export default function CartDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    items,
    totalAmount,
    totalQuantity,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
  } = useCartStore();

  const hasItems = totalQuantity > 0;
  const totalWithDelivery = totalAmount + DELIVERY_CHARGE;

  const toggleOpen = () => setOpen((prev) => !prev);

  const goToCheckout = () => {
    setOpen(false);
    router.push("/checkout");
  };

  return (
    <>
      {/* Floating cart button - mobile-first, always visible */}
      <motion.button
        type="button"
        onClick={toggleOpen}
        className="fixed bottom-5 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 rounded-2xl bg-amber-400 px-5 py-3.5 text-sm font-semibold text-black shadow-2xl shadow-amber-400/30 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        whileHover={{ scale: 1.04, boxShadow: "0 25px 50px -12px rgba(251, 191, 36, 0.35)" }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="text-xs sm:text-sm">Cart</span>
        <span className="rounded-full bg-black/15 px-2 py-0.5 text-xs font-bold">
          {totalQuantity}
        </span>
        <span className="font-semibold text-black/80">₹{totalAmount}</span>
      </motion.button>

      {/* Slide-in cart drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={toggleOpen}
              aria-hidden
            />
            <motion.aside
              className="fixed bottom-0 left-0 right-0 z-50 flex h-[70vh] max-h-[600px] flex-col rounded-t-3xl border-t border-zinc-800 bg-zinc-950 shadow-2xl sm:bottom-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-[380px] sm:rounded-none sm:border-l sm:border-t-0"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <header className="flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-50">
                    Your cart
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {hasItems ? "Review and proceed to checkout." : "Cart is empty."}
                  </p>
                </div>
                <motion.button
                  type="button"
                  onClick={toggleOpen}
                  className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Close
                </motion.button>
              </header>

              <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
                {hasItems ? (
                  <motion.ul
                    className="space-y-3"
                    initial="hidden"
                    animate="show"
                    variants={{
                      hidden: {},
                      show: { transition: { staggerChildren: 0.04 } },
                    }}
                  >
                    {items.map((item, i) => (
                      <motion.li
                        key={item.id}
                        variants={{
                          hidden: { opacity: 0, x: -8 },
                          show: { opacity: 1, x: 0 },
                        }}
                        className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/80 px-4 py-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-zinc-50 truncate">{item.name}</p>
                          <p className="text-xs text-zinc-400">
                            ₹{item.price} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5 rounded-full bg-zinc-800 p-0.5">
                            <button
                              type="button"
                              onClick={() => decreaseQuantity(item.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-50"
                            >
                              −
                            </button>
                            <span className="min-w-[1.25rem] text-center text-xs font-medium">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => increaseQuantity(item.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-zinc-50"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-xs text-zinc-500 transition-colors hover:text-red-400"
                          >
                            Remove
                          </button>
                          <span className="min-w-[4rem] text-right text-sm font-semibold text-amber-300">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </motion.ul>
                ) : (
                  <p className="py-8 text-center text-sm text-zinc-500">
                    Add items from the menu to get started.
                  </p>
                )}
              </div>

              <footer className="shrink-0 border-t border-zinc-800/80 bg-zinc-950 px-4 py-4">
                <div className="mb-2 flex justify-between text-sm text-zinc-400">
                  <span>Subtotal</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="mb-3 flex justify-between text-sm text-zinc-400">
                  <span>Delivery</span>
                  <span>₹{DELIVERY_CHARGE}</span>
                </div>
                <div className="mb-4 flex justify-between text-base font-bold text-zinc-50">
                  <span>Total</span>
                  <span className="text-amber-300">₹{totalWithDelivery}</span>
                </div>
                <motion.button
                  type="button"
                  disabled={!hasItems}
                  onClick={goToCheckout}
                  className="flex w-full items-center justify-center rounded-2xl bg-amber-400 py-3.5 text-sm font-semibold text-black shadow-lg shadow-amber-400/20 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none"
                  whileHover={hasItems ? { scale: 1.01 } : {}}
                  whileTap={hasItems ? { scale: 0.99 } : {}}
                >
                  Proceed to checkout
                </motion.button>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
