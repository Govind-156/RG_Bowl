"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { z } from "zod";
import { useCartStore } from "@/lib/cart-store";
import {
  DELIVERY_CHARGE,
  REFERRAL_FIRST_ORDER_DISCOUNT,
  DELIVERY_ALLOWED_AREA_KEYWORDS,
} from "@/lib/constants";

const checkoutSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  address: z.string().min(1, "Delivery address is required"),
  roomNumber: z.string().min(1, "Room number is required"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

function calculateReferralMaggiDiscount(items: { name: string; price: number; quantity: number }[]): number {
  const maggiItems = items.filter((item) =>
    item.name.toLowerCase().includes("maggi"),
  );
  if (maggiItems.length === 0) return 0;
  const highestPrice = maggiItems.reduce(
    (max, item) => (item.price > max ? item.price : max),
    0,
  );
  // 50% off the highest-priced Maggi (one bowl).
  return Math.round(highestPrice / 2);
}

function isAddressInAllowedArea(address: string): boolean {
  const lower = address.toLowerCase();
  return DELIVERY_ALLOWED_AREA_KEYWORDS.some((keyword) =>
    lower.includes(keyword.toLowerCase()),
  );
}

/** Reverse geocode lat/lng to address using OpenStreetMap Nominatim. */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");
  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "MidnightMaggiBTM/1.0 (food delivery; contact optional)",
    },
  });
  if (!res.ok) throw new Error("Could not fetch address");
  const data = (await res.json()) as { display_name?: string };
  return data.display_name ?? `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

async function loadRazorpayScript() {
  if (typeof window === "undefined") return false;
  if (document.getElementById("razorpay-checkout-js")) return true;
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, totalAmount: subtotal, clearCart } = useCartStore();

  const [referralStatus, setReferralStatus] = useState<{
    firstOrder25Off: boolean;
    freeClassicMaggiAvailable: boolean;
  } | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string;
    code: string;
    discount: number;
    type: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<
    {
      id: string;
      code: string;
      type: string;
      value: number;
      minOrderValue: number | null;
      firstOrderOnly: boolean;
      maxDiscount: number | null;
      eligible: boolean;
      reason: string | null;
    }[]
  >([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    name: "",
    phone: "",
    address: "",
    roomNumber: "",
  });
  const [preferredLanguage, setPreferredLanguage] = useState<
    "KANNADA" | "HINDI" | "ENGLISH" | "TELUGU"
  >("ENGLISH");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [spinReward, setSpinReward] = useState<{
    type: "discount" | "freebie";
    value: number | string;
    label: string;
  } | null>(null);

  const user = session?.user as { name?: string | null; phone?: string | null } | undefined;
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      name: prev.name || (user.name ?? "") || "",
      phone: prev.phone || (user.phone ?? "") || "",
    }));
  }, [user?.name, user?.phone]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/checkout");
      return;
    }
    if (status === "authenticated" && items.length === 0) {
      router.replace("/");
    }
  }, [status, items.length, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/me/referral-status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data)
          setReferralStatus({
            firstOrder25Off: data.firstOrder25Off ?? false,
            freeClassicMaggiAvailable: data.freeClassicMaggiAvailable ?? false,
          });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [status]);

  const referralDiscount =
    referralStatus?.firstOrder25Off ?? false
      ? Math.round(subtotal * REFERRAL_FIRST_ORDER_DISCOUNT)
      : 0;
  const freeClassicDiscount =
    referralStatus?.freeClassicMaggiAvailable ?? false
      ? calculateReferralMaggiDiscount(items)
      : 0;
  const totalDiscount = referralDiscount + freeClassicDiscount;
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
  const couponDiscount = appliedCoupon?.discount ?? 0;
  const deliveryAmount =
    appliedCoupon?.type === "FREE_DELIVERY" ? 0 : DELIVERY_CHARGE;
  const amountAfterCoupon = Math.max(0, discountedSubtotal - couponDiscount + deliveryAmount);
  const spinDiscount =
    spinReward?.type === "discount"
      ? Math.min(Number(spinReward.value) || 0, amountAfterCoupon)
      : 0;
  const totalPrice = Math.max(0, amountAfterCoupon - spinDiscount);
  const usedFreeClassicMaggi = freeClassicDiscount > 0;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("rg_spin_reward");
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        wonAt?: string;
        reward?: { type?: string; value?: number | string; label?: string };
      };
      const rewardType = parsed.reward?.type;
      const rewardValue = parsed.reward?.value;
      const rewardLabel = parsed.reward?.label;
      if (
        (rewardType !== "discount" && rewardType !== "freebie") ||
        rewardValue == null
      ) {
        return;
      }

      // Expire spin reward after 24 hours.
      const wonAt = parsed.wonAt ? Date.parse(parsed.wonAt) : NaN;
      const maxAgeMs = 24 * 60 * 60 * 1000;
      if (Number.isFinite(wonAt) && Date.now() - wonAt > maxAgeMs) {
        localStorage.removeItem("rg_spin_reward");
        return;
      }

      setSpinReward({
        type: rewardType,
        value: rewardValue,
        label:
          typeof rewardLabel === "string" && rewardLabel.trim()
            ? rewardLabel
            : rewardType === "discount"
              ? `₹${rewardValue} OFF`
              : "Free reward",
      });
    } catch {
      // ignore invalid localStorage payload
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    const loadCoupons = async () => {
      try {
        setCouponsLoading(true);
        const res = await fetch(`/api/coupons?subtotal=${discountedSubtotal}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as unknown;
        if (!cancelled && Array.isArray(data)) {
          setAvailableCoupons(
            data as {
              id: string;
              code: string;
              type: string;
              value: number;
              minOrderValue: number | null;
              firstOrderOnly: boolean;
              maxDiscount: number | null;
              eligible: boolean;
              reason: string | null;
            }[],
          );
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setCouponsLoading(false);
      }
    };
    void loadCoupons();
    return () => {
      cancelled = true;
    };
  }, [status, discountedSubtotal]);

  const handleApplyCoupon = async (codeOverride?: string) => {
    const code = (codeOverride ?? couponCode).trim();
    if (!code) return;
    setCouponError(null);
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Coupon rules apply after referral discounts.
        body: JSON.stringify({ code, subtotal: discountedSubtotal }),
      });
      const data = (await res.json()) as {
        valid?: boolean;
        message?: string;
        discount?: number;
        couponId?: string;
        type?: string;
      };
      if (data.valid && data.couponId != null && typeof data.discount === "number") {
        setAppliedCoupon({
          couponId: data.couponId,
          code: code.toUpperCase(),
          discount: data.discount,
          type: data.type ?? "PERCENT_DISCOUNT",
        });
        setCouponCode("");
      } else {
        setCouponError(data.message ?? "Invalid or expired coupon.");
      }
    } catch {
      setCouponError("Could not validate coupon. Try again.");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError(null);
  };

  const validation = checkoutSchema.safeParse(form);
  const fieldErrors = !validation.success
    ? validation.error.flatten().fieldErrors
    : {};
  const isFormValid = validation.success;

  const handleChange =
    (field: keyof CheckoutForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setError(null);
      if (submitted) setSubmitted(false);
    };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Location is not supported by your browser.");
      return;
    }
    setLocationStatus("loading");
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        try {
          const address = await reverseGeocode(lat, lon);
          setLatitude(lat);
          setLongitude(lon);
          setForm((prev) => ({ ...prev, address }));
          setLocationStatus("success");
        } catch {
          setLatitude(lat);
          setLongitude(lon);
          setForm((prev) => ({
            ...prev,
            address: `${lat.toFixed(6)}, ${lon.toFixed(6)}`,
          }));
          setLocationStatus("success");
        }
      },
      () => {
        setLocationStatus("error");
        setError("Could not get your location. Check permissions or enter address manually.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handlePay = async () => {
    setSubmitted(true);
    if (!isFormValid || items.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Block checkout if ordering is paused — show message and do not open payment
      const settingsRes = await fetch("/api/settings", { cache: "no-store" });
      if (settingsRes.ok) {
        const settings = (await settingsRes.json()) as { isOrderingPaused?: boolean; pauseReason?: string | null };
        if (settings.isOrderingPaused) {
          setError(settings.pauseReason?.trim() || "Ordering is currently paused. Please try again later.");
          return;
        }
      }

      // Enforce delivery area restriction (BTM only, configurable via DELIVERY_ALLOWED_AREA_KEYWORDS).
      if (!isAddressInAllowedArea(form.address)) {
        setError("We currently deliver only in BTM.");
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError("Payment gateway could not be loaded. Check your connection and try again.");
        return;
      }

      const amountPaise = totalPrice * 100;
      const createRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: `mm_${Date.now()}`,
          notes: {
            userId: (session?.user as { id?: string })?.id,
            name: form.name,
            phone: form.phone,
            address: form.address,
            roomNumber: form.roomNumber,
          },
        }),
      });

      if (!createRes.ok) {
        const data = (await createRes.json().catch(() => ({}))) as { error?: string; message?: string };
        setError(data.error || data.message || "Failed to start payment. Try again.");
        return;
      }

      const orderData = await createRes.json();
      const fullAddress = `${form.address.trim()}, Room: ${form.roomNumber.trim()}`;

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "RG Bowl",
        description: "Order payment",
        order_id: orderData.id,
        prefill: { name: form.name, contact: form.phone },
        theme: { color: "#fbbf24" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  order: {
                    userId: (session?.user as { id?: string })?.id,
                    address: fullAddress,
                    latitude: latitude ?? undefined,
                    longitude: longitude ?? undefined,
                    items: items.map((i) => ({
                      id: i.id,
                      name: i.name,
                      quantity: i.quantity,
                      price: i.price,
                    })),
                    totalAmount: totalPrice,
                    referralDiscountAmount: totalDiscount,
                    usedFreeClassicMaggi,
                    couponId: appliedCoupon?.couponId ?? null,
                    couponDiscountAmount: couponDiscount,
                    preferredLanguage,
                  },
                }),
            });

            if (!verifyRes.ok) {
              const errData = (await verifyRes.json().catch(() => ({}))) as { error?: string };
              setError(errData?.error ?? "Payment verification failed. Contact support if you were charged.");
              return;
            }

            const verifyData = (await verifyRes.json()) as { order?: { id?: string } };
            const orderId = verifyData?.order?.id;

            // Order created successfully. Clear cart then redirect with full page load so redirect always happens (Razorpay modal can close before router.push runs).
            const summary = {
              items: items.map((i) => ({ id: i.id, name: i.name, quantity: i.quantity })),
              totalAmount: totalPrice,
            };
            localStorage.removeItem("rg_spin_reward");
            clearCart();
            const placed = Date.now();
            const successUrl = orderId
              ? `/success?orderId=${encodeURIComponent(orderId)}&summary=${encodeURIComponent(JSON.stringify(summary))}&placed=${placed}`
              : `/success?summary=${encodeURIComponent(JSON.stringify(summary))}&placed=${placed}`;
            window.location.href = successUrl;
          } catch (e) {
            console.error("Payment verify error", e);
            setError("Something went wrong after payment. Contact support if you were charged.");
          }
        },
        modal: { ondismiss: () => setError("Payment cancelled. You can try again.") },
      };

      type RazorpayInstance = { open: () => void };
      type RazorpayConstructor = new (opts: unknown) => RazorpayInstance;
      const w = window as Window & { Razorpay?: RazorpayConstructor };
      const Razorpay = w.Razorpay;
      if (!Razorpay) {
        setError("Payment gateway could not be loaded. Please try again.");
        return;
      }
      new Razorpay(options).open();
    } catch {
      setError("Unable to start payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && items.length === 0)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        <p>Loading…</p>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-zinc-50 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-xl font-semibold tracking-tight sm:text-2xl">
          Checkout
        </h1>

        <section className="ui-card mb-8 border border-zinc-800 bg-zinc-950/60 p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Order summary
          </h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex justify-between text-sm"
              >
                <span className="text-zinc-300">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium text-amber-300">
                  ₹{item.price * item.quantity}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-zinc-800 pt-4 text-sm">
            <div className="flex justify-between text-zinc-400">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            {referralDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>25% off (referral)</span>
                <span>-₹{referralDiscount}</span>
              </div>
            )}
            {freeClassicDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>50% off highest Maggi (referral)</span>
                <span>-₹{freeClassicDiscount}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponError(null);
                }}
                placeholder="Coupon code"
                className="flex-1 min-w-[120px] rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                disabled={!!appliedCoupon}
              />
              {appliedCoupon ? (
                <div className="flex flex-1 min-w-[200px] items-center justify-between gap-2 rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm">
                  <span className="text-emerald-400">{appliedCoupon.code} applied</span>
                  <motion.button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="text-xs text-zinc-400 underline hover:text-zinc-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    Remove
                  </motion.button>
                </div>
              ) : (
                <motion.button
                  type="button"
                  onClick={() => void handleApplyCoupon()}
                  disabled={couponLoading || !couponCode.trim()}
                  className="rounded-lg border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {couponLoading ? "Checking…" : "Apply"}
                </motion.button>
              )}
            </div>
            {couponError && (
              <p className="text-xs text-red-400">{couponError}</p>
            )}
            {appliedCoupon && (
              <div className="flex justify-between text-emerald-400">
                <span>Coupon ({appliedCoupon.code})</span>
                <span>-₹{appliedCoupon.discount}</span>
              </div>
            )}
            {spinReward?.type === "discount" && spinDiscount > 0 && (
              <div className="flex justify-between text-cyan-300">
                <span className="flex items-center gap-2">
                  <span>🎁 Reward Applied ({spinReward.label})</span>
                  <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                    Spin & Win
                  </span>
                </span>
                <span>-₹{spinDiscount}</span>
              </div>
            )}
            {spinReward?.type === "freebie" && (
              <div className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200">
                <div className="mb-1 inline-flex items-center gap-2">
                  <span>🎁 Reward Applied</span>
                  <span className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-200">
                    Spin & Win
                  </span>
                </div>
                <div>
                  Free {String(spinReward.value)} will be added{" "}
                {String(spinReward.value).toLowerCase() === "cheese" ? "🧀" : "🧈"}
                </div>
              </div>
            )}
            <div className="mt-2 border-t border-zinc-800 pt-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Available coupons
                </span>
                {couponsLoading && (
                  <span className="text-[11px] text-zinc-500">Loading…</span>
                )}
              </div>
              {availableCoupons.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No active coupons right now.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableCoupons.map((c) => {
                    const disabled = !!appliedCoupon || !c.eligible || couponLoading;
                    const benefit =
                      c.type === "FREE_DELIVERY"
                        ? "Free delivery"
                        : c.type === "PERCENT_DISCOUNT"
                          ? `${c.value}% off${c.firstOrderOnly ? " (first order)" : ""}`
                          : `₹${c.value} off${(c.minOrderValue ?? 0) > 0 ? ` on ₹${c.minOrderValue}+` : ""}`;
                    return (
                      <motion.button
                        key={c.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          void handleApplyCoupon(c.code);
                        }}
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                          c.eligible
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/15"
                            : "border-zinc-800 bg-zinc-900/30 text-zinc-500"
                        } disabled:cursor-not-allowed disabled:opacity-60`}
                        title={!c.eligible ? c.reason ?? "Not eligible" : benefit}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="font-mono font-semibold">{c.code}</span>
                        <span className="ml-2 text-[11px] opacity-80">{benefit}</span>
                        {!c.eligible && c.reason && (
                          <span className="ml-2 text-[11px] text-zinc-500">
                            ({c.reason})
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex justify-between text-zinc-400">
              <span>Delivery charge</span>
              <span>{deliveryAmount === 0 ? "Free" : `₹${deliveryAmount}`}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-2 text-base font-semibold text-zinc-50">
              <span>Total</span>
              <span className="text-amber-300">₹{totalPrice}</span>
            </div>
          </div>
        </section>

        <section className="ui-card mb-8 border border-zinc-800 bg-zinc-950/60 p-4 sm:p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Delivery details
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="preferredLanguage" className="mb-1 block text-xs font-medium text-zinc-400">
                Preferred delivery language
              </label>
              <select
                id="preferredLanguage"
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value as typeof preferredLanguage)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
              >
                <option value="ENGLISH">English</option>
                <option value="KANNADA">Kannada</option>
                <option value="HINDI">Hindi</option>
                <option value="TELUGU">Telugu</option>
              </select>
              <p className="mt-1 text-[11px] text-zinc-500">
                We&apos;ll share this with your delivery partner.
              </p>
            </div>
            <div>
              <label htmlFor="name" className="mb-1 block text-xs font-medium text-zinc-400">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                placeholder="Your full name"
              />
              {submitted && fieldErrors.name?.[0] && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.name[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="mb-1 block text-xs font-medium text-zinc-400">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange("phone")}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                placeholder="10-digit mobile number"
              />
              {submitted && fieldErrors.phone?.[0] && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.phone[0]}</p>
              )}
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="address" className="block text-xs font-medium text-zinc-400">
                  Address
                </label>
                <motion.button
                  type="button"
                  onClick={handleUseMyLocation}
                  disabled={locationStatus === "loading"}
                  className="rounded-full border border-amber-400/60 bg-amber-400/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition hover:bg-amber-400/20 disabled:opacity-50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  {locationStatus === "loading"
                    ? "Getting location…"
                    : "Use My Location"}
                </motion.button>
              </div>
              {latitude != null && longitude != null && (
                <p className="mb-1.5 text-[11px] text-zinc-500">
                  Location: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </p>
              )}
              <textarea
                id="address"
                value={form.address}
                onChange={handleChange("address")}
                rows={3}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                placeholder="PG / Hostel name, building, area — or use “Use My Location”"
              />
              {submitted && fieldErrors.address?.[0] && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.address[0]}</p>
              )}
            </div>
            <div>
              <label htmlFor="roomNumber" className="mb-1 block text-xs font-medium text-zinc-400">
                Room number
              </label>
              <input
                id="roomNumber"
                type="text"
                value={form.roomNumber}
                onChange={handleChange("roomNumber")}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none"
                placeholder="e.g. 203, Block B"
              />
              {submitted && fieldErrors.roomNumber?.[0] && (
                <p className="mt-1 text-xs text-red-400">{fieldErrors.roomNumber[0]}</p>
              )}
            </div>
          </div>
        </section>

        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="text-center text-sm text-zinc-400 underline hover:text-zinc-300"
          >
            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              ← Back to menu
            </motion.span>
          </Link>
          <motion.button
            type="button"
            disabled={!isFormValid || isProcessing}
            onClick={handlePay}
            className="rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-400/30 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {isProcessing ? "Opening payment…" : `Pay ₹${totalPrice}`}
          </motion.button>
        </div>
      </div>
    </main>
  );
}
