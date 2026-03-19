"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Reward = {
  label: string;
  type: "discount" | "freebie" | "none";
  value: number | string;
};

const rewards: Reward[] = [
  { label: "₹10 OFF", type: "discount", value: 10 },
  { label: "Free Cheese 🧀", type: "freebie", value: "cheese" },
  { label: "Better luck 😭", type: "none", value: 0 },
  { label: "₹20 OFF", type: "discount", value: 20 },
  { label: "Free Butter 🧈", type: "freebie", value: "butter" },
  { label: "Try Again 😅", type: "none", value: 0 },
];

const WHEEL_COLORS = [
  "#f59e0b",
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#60a5fa",
];

function getConicBackground() {
  const segment = 360 / rewards.length;
  const stops: string[] = [];
  for (let i = 0; i < rewards.length; i += 1) {
    const start = i * segment;
    const end = start + segment;
    stops.push(`${WHEEL_COLORS[i % WHEEL_COLORS.length]} ${start}deg ${end}deg`);
  }
  return `conic-gradient(${stops.join(", ")})`;
}

function isWin(reward: Reward) {
  return reward.type !== "none";
}

export default function SpinWheel({
  spinKey,
  onClose,
}: {
  spinKey: string;
  onClose: () => void;
}) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<Reward | null>(null);
  const [canSpin, setCanSpin] = useState(true);

  const background = useMemo(() => getConicBackground(), []);
  const storageKey = `rg_spin_done_${spinKey}`;

  useEffect(() => {
    try {
      const done = sessionStorage.getItem(storageKey) === "1";
      if (done) setCanSpin(false);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const handleSpin = () => {
    if (isSpinning || !canSpin) return;

    const selectedIndex = Math.floor(Math.random() * rewards.length);
    const selectedReward = rewards[selectedIndex];
    const segmentAngle = 360 / rewards.length;
    const selectedCenterAngle = selectedIndex * segmentAngle + segmentAngle / 2;

    const currentNorm = ((rotation % 360) + 360) % 360;
    const desiredNorm = (360 - selectedCenterAngle + 360) % 360;
    const deltaNorm = (desiredNorm - currentNorm + 360) % 360;
    const fullSpins = 3 + Math.floor(Math.random() * 3); // 3–5
    const targetRotation = rotation + fullSpins * 360 + deltaNorm;

    setIsSpinning(true);
    setResult(null);
    setRotation(targetRotation);

    window.setTimeout(() => {
      setIsSpinning(false);
      setResult(selectedReward);
      setCanSpin(false);
      try {
        sessionStorage.setItem(storageKey, "1");
      } catch {
        // ignore
      }
      try {
        const rewardPayload = {
          source: "spin_win",
          spinKey,
          reward: selectedReward,
          wonAt: new Date().toISOString(),
          discount:
            selectedReward.type === "discount"
              ? {
                  code: `SPIN${String(selectedReward.value)}`,
                  type: "FIXED_OFF",
                  value: Number(selectedReward.value),
                }
              : undefined,
          freebie:
            selectedReward.type === "freebie"
              ? {
                  item: String(selectedReward.value),
                  eligibleOnNextOrder: true,
                }
              : undefined,
        };
        localStorage.setItem("rg_spin_reward", JSON.stringify(rewardPayload));
      } catch {
        // ignore
      }
    }, 3300);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md rounded-2xl border border-zinc-700 bg-[#0f172a] p-5 shadow-2xl shadow-cyan-500/10"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-50">Spin &amp; Win</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-zinc-600 px-3 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800"
          >
            Close
          </button>
        </div>

        <div className="relative mx-auto mb-4 flex w-full max-w-[320px] items-center justify-center">
          <div className="absolute -top-2 z-20 h-0 w-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.75)]" />

          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 3.2, ease: [0.2, 0.85, 0.25, 1] }}
            className="relative h-[280px] w-[280px] rounded-full border-4 border-zinc-800 shadow-[0_0_25px_rgba(34,211,238,0.15)]"
            style={{ background }}
          >
            {rewards.map((reward, idx) => {
              const angle = (360 / rewards.length) * idx + 30;
              return (
                <div
                  key={reward.label + idx}
                  className="absolute left-1/2 top-1/2 w-[92px] -translate-x-1/2 -translate-y-1/2 text-center text-[11px] font-semibold text-zinc-900"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-110px) rotate(${-angle}deg)`,
                  }}
                >
                  {reward.label}
                </div>
              );
            })}
            <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-900 bg-black/80 shadow-[0_0_15px_rgba(251,191,36,0.3)]" />
          </motion.div>
        </div>

        <button
          type="button"
          onClick={handleSpin}
          disabled={!canSpin || isSpinning}
          className="w-full rounded-full bg-amber-400 px-4 py-3 text-sm font-bold text-black shadow-lg shadow-amber-400/30 transition duration-300 hover:scale-[1.03] hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
        >
          {isSpinning ? "Spinning..." : canSpin ? "SPIN 🎯" : "Already spun"}
        </button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25 }}
              className="mt-4 rounded-xl border border-zinc-700 bg-zinc-900/70 p-4 text-center"
            >
              {isWin(result) ? (
                <>
                  <p className="text-base font-semibold text-emerald-300">
                    🎉 You won {result.label}!
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Saved for your next order.
                  </p>
                  <div className="pointer-events-none mt-2 flex justify-center gap-1">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: [0, 1, 0], y: [0, 12, 20] }}
                        transition={{ duration: 0.8, delay: i * 0.03 }}
                        className="h-1.5 w-1.5 rounded-full bg-amber-300"
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-base font-semibold text-zinc-300">
                  😭 Better luck next time
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

