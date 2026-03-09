"use client";

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin-app/orders";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    setIsSubmitting(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-50">
      <section className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">Admin Login</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Enter your admin credentials to access orders, revenue, and analytics.
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-500 focus:border-amber-400"
              placeholder="admin@example.com"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none ring-0 placeholder:text-zinc-500 focus:border-amber-400"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black shadow-md shadow-amber-400/30 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-16 text-zinc-50">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-800" />
      </main>
    }>
      <AdminLoginForm />
    </Suspense>
  );
}

