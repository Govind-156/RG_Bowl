"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800/80 bg-zinc-950/95 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link
          href="/"
          className="text-sm font-bold tracking-wide text-amber-400 transition-colors hover:text-amber-300 sm:text-base"
        >
          RG Bowl
        </Link>
        <nav className="flex items-center gap-3 text-xs sm:gap-4 sm:text-sm">
          <Link
            href="/contact"
            className="text-zinc-300 hover:text-zinc-50"
          >
            Contact
          </Link>
          {status === "loading" ? (
            <span className="text-zinc-500">…</span>
          ) : session ? (
            <>
              {role === "admin" && (
                <Link
                  href="/admin-app/orders"
                  className="text-amber-300 hover:text-amber-200"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/profile#orders"
                className="text-zinc-300 hover:text-zinc-50"
              >
                My orders
              </Link>
              <Link
                href="/my-referrals"
                className="text-zinc-300 hover:text-zinc-50"
              >
                My referrals
              </Link>
              <Link
                href="/profile"
                className="text-zinc-300 hover:text-zinc-50"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="text-zinc-400 hover:text-zinc-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-zinc-300 hover:text-zinc-50"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-amber-400 px-3 py-1.5 text-xs font-semibold text-black shadow-sm hover:bg-amber-300 sm:px-4 sm:py-2 sm:text-sm"
              >
                Signup
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
