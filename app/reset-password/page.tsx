"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function ResetPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidOtp, setInvalidOtp] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInvalidOtp(false);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }
    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim(), newPassword }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        if (data.error?.toLowerCase().includes("otp") || data.error?.toLowerCase().includes("expired") || data.error?.toLowerCase().includes("invalid")) {
          setInvalidOtp(true);
        }
        return;
      }

      router.push("/login?reset=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (invalidOtp) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 py-16 text-zinc-50">
        <section className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-lg text-center">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">
            OTP expired or invalid
          </h1>
          <p className="mb-6 text-sm text-zinc-400">
            This OTP has expired or is invalid. Request a new OTP below.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black shadow-md hover:bg-amber-300"
          >
            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              Get new OTP
            </motion.span>
          </Link>
          <p className="mt-4 text-center text-xs text-zinc-400">
            <Link href="/login" className="font-medium text-amber-400 hover:text-amber-300">
              <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                ← Back to login
              </motion.span>
            </Link>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 py-16 text-zinc-50">
      <section className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-lg">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">
          Set new password
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          Enter your email, OTP, and new password below.
        </p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-zinc-300"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-zinc-300"
              htmlFor="otp"
            >
              OTP
            </label>
            <input
              id="otp"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
              placeholder="6-digit OTP"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-zinc-300"
              htmlFor="newPassword"
            >
              New password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-1.5">
            <label
              className="text-xs font-medium text-zinc-300"
              htmlFor="confirmPassword"
            >
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black shadow-md shadow-amber-400/30 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </motion.button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-400">
          <Link href="/login" className="font-medium text-amber-400 hover:text-amber-300">
            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              ← Back to login
            </motion.span>
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
          <p>Loading…</p>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
