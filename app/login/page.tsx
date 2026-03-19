"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const registered = searchParams.get("registered");
  const reset = searchParams.get("reset");

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
      callbackUrl,
    });

    setIsSubmitting(false);

    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }

    if (res?.url) {
      router.push(res.url);
    } else {
      router.push(callbackUrl);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 py-16 text-zinc-50">
      <section className="ui-card w-full max-w-sm border border-zinc-800 bg-zinc-950/80 p-6 shadow-lg">
        <h1 className="mb-2 text-xl font-semibold tracking-tight">Log in</h1>
        <p className="mb-6 text-sm text-zinc-400">
          Sign in to your RG Bowl account.
        </p>
        {registered === "1" && (
          <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            Account created. You can log in now.
          </p>
        )}
        {reset === "1" && (
          <p className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
            Password reset. You can log in now.
          </p>
        )}
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
              placeholder="you@example.com"
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <p className="text-right text-xs">
            <Link href="/forgot-password" className="text-amber-400 hover:text-amber-300">
              Forgot password?
            </Link>
          </p>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black shadow-md shadow-amber-400/30 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
          >
            {isSubmitting ? "Logging in…" : "Log in"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-amber-400 hover:text-amber-300">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-black px-6 py-16 text-zinc-50">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-800" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
