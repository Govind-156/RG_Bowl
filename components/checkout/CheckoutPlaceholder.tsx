"use client";

import { motion } from "framer-motion";

export default function CheckoutPlaceholder() {
  return (
    <motion.section
      id="checkout-section"
      className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-950/80 px-5 py-5 shadow-xl sm:px-6"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="mb-2 text-base font-semibold text-zinc-50">Secure checkout</h2>
      <p className="text-sm text-zinc-400">
        Open the cart, then go to checkout to enter your details and pay with
        Razorpay (UPI, card, or net banking). Flat delivery applies.
      </p>
    </motion.section>
  );
}
