import type { ReactNode } from "react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="text-sm font-semibold tracking-wide text-amber-400">
            RG Bowl – Admin
          </span>
          <nav className="flex gap-4 text-xs text-zinc-400">
            <Link href="/admin-app/orders" className="hover:text-zinc-100">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto flex w-full max-w-5xl flex-1 px-6 py-8">{children}</section>
    </main>
  );
}

