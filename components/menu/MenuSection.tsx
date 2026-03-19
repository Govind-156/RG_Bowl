"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/lib/cart-store";

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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

function DishCardSkeleton() {
  return (
    <motion.div
      variants={item}
      className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/80 shadow-lg"
    >
      <div className="aspect-[4/3] w-full animate-pulse rounded-t-2xl bg-zinc-800/80" />
      <div className="flex flex-col gap-3 p-4">
        <div className="h-4 w-3/4 rounded-lg bg-zinc-800/80 animate-pulse" />
        <div className="h-3 w-full rounded bg-zinc-800/60 animate-pulse" />
        <div className="h-3 w-2/3 rounded bg-zinc-800/60 animate-pulse" />
        <div className="mt-2 flex items-center justify-between">
          <div className="h-5 w-16 rounded bg-zinc-800/80 animate-pulse" />
          <div className="h-9 w-28 rounded-full bg-zinc-800/80 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}

function DishCard({
  dish,
  onAddToCart,
}: {
  dish: Dish;
  onAddToCart: (dish: Dish) => void;
}) {
  return (
    <motion.article
      variants={item}
      className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/80 shadow-xl shadow-black/20 transition-shadow hover:shadow-amber-400/5 hover:border-zinc-700"
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-800">
        {dish.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dish.image}
            alt={dish.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
            <span className="text-5xl opacity-40">🍜</span>
          </div>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-amber-400/95 px-2.5 py-1 text-xs font-bold text-black shadow-lg">
          ₹{dish.price}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4 text-left">
        <span className="mb-2 inline-block rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          {dish.category}
        </span>
        <h3 className="mb-1.5 text-base font-semibold text-zinc-50 sm:text-lg">
          {dish.name}
        </h3>
        <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-zinc-400">
          {dish.description}
        </p>
        <motion.button
          type="button"
          className="inline-flex w-full items-center justify-center rounded-full bg-amber-400 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-400/20 transition-colors hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onAddToCart(dish)}
        >
          Add to cart
        </motion.button>
      </div>
    </motion.article>
  );
}

export default function MenuSection() {
  const addItem = useCartStore((state) => state.addItem);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastTimer, setToastTimer] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setError(null);
        const res = await fetch("/api/dishes", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load menu");
        const data = (await res.json()) as Dish[];
        if (!cancelled) setDishes(data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message || "Unable to load menu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(dishes.map((d) => d.category).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [dishes]);

  const filteredDishes = useMemo(() => {
    if (selectedCategory === "All") return dishes;
    return dishes.filter((d) => d.category === selectedCategory);
  }, [dishes, selectedCategory]);

  const handleAddToCart = (dish: Dish) => {
    addItem({ id: dish.id, name: dish.name, price: dish.price });
    if (toastTimer) window.clearTimeout(toastTimer);
    setToastOpen(true);
    const id = window.setTimeout(() => setToastOpen(false), 2400);
    setToastTimer(id);
  };

  return (
    <motion.section
      className="relative w-full max-w-5xl rounded-2xl border border-zinc-800/80 bg-zinc-950/80 px-4 py-6 shadow-2xl sm:px-6 sm:py-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
            Menu
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Freshly cooked and delivered in 25–30 minutes.
          </p>
        </div>
        <p className="text-sm font-medium text-amber-300">
          Flat delivery · No surge
        </p>
      </header>

      <AnimatePresence>
        {toastOpen && (
          <motion.div
            key="add-to-cart-toast"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="pointer-events-none fixed bottom-24 left-1/2 z-[60] w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-amber-400/30 bg-zinc-950/95 px-4 py-3 text-sm text-zinc-100 shadow-2xl shadow-black/40 backdrop-blur"
          >
            <p className="font-semibold text-amber-200">🍜 Added to your bowl!</p>
            <p className="text-xs text-zinc-300">Don’t forget drinks 👀</p>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 rounded-xl bg-red-500/10 px-4 py-2 text-sm text-red-400"
        >
          {error} Please refresh or try again.
        </motion.p>
      )}

      {!error && categories.length > 1 && !loading && (
        <motion.div
          className="mb-6 flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {categories.map((cat) => (
            <motion.button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
                selectedCategory === cat
                  ? "bg-amber-400 text-black shadow-lg shadow-amber-400/20"
                  : "border border-zinc-700 bg-zinc-900/90 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800"
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              {cat}
            </motion.button>
          ))}
        </motion.div>
      )}

      {loading ? (
        <motion.div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <DishCardSkeleton key={i} />
          ))}
        </motion.div>
      ) : filteredDishes.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8 text-center text-sm text-zinc-400"
        >
          {selectedCategory === "All"
            ? "We're not serving any items right now. Check back later."
            : `No dishes in "${selectedCategory}". Try another category.`}
        </motion.p>
      ) : (
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          <AnimatePresence mode="popLayout">
            {filteredDishes.map((dish) => (
              <DishCard
                key={dish.id}
                dish={dish}
                onAddToCart={handleAddToCart}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.section>
  );
}
