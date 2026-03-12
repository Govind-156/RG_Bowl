import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth-helpers";
import Link from "next/link";

export default async function AdminAppLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login?callbackUrl=/admin-app/orders");
  }

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-sm font-semibold tracking-wide text-amber-400">
            RG Bowl – Admin Dashboard
          </span>
          <nav className="flex gap-4 text-xs text-zinc-400">
            <Link href="/" className="hover:text-zinc-100">
              Customer app
            </Link>
          </nav>
        </div>
      </header>
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:flex-row">
        <aside className="w-full md:w-56">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-3">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              Admin
            </p>
            <nav className="grid grid-cols-2 gap-2 md:grid-cols-1">
              <Link
                href="/admin-app/menu"
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/70"
              >
                Dishes
              </Link>
              <Link
                href="/admin-app/orders"
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/70"
              >
                Orders
              </Link>
              <Link
                href="/admin-app/settings"
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/70"
              >
                Settings
              </Link>
              <Link
                href="/admin-app/analytics"
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/70"
              >
                Analytics
              </Link>
              <Link
                href="/admin-app/revenue"
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/70"
              >
                Revenue
              </Link>
              <Link
                href="/admin-app/coupons"
                className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-900/70"
              >
                Coupons
              </Link>
            </nav>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </section>
    </main>
  );
}

