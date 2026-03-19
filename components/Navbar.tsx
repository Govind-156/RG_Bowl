"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, User, ChevronDown, LogOut, ShoppingBag, Gift, Phone, Shield, Truck } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const userName = (session?.user as { name?: string } | undefined)?.name;
  const pathname = usePathname();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDrawerOpen(false);
    setProfileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [profileOpen]);

  const navLinkClass =
    "text-zinc-300 transition-all duration-300 hover:text-amber-400 hover:scale-105 inline-block";

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-white/5 backdrop-blur-lg"
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
          {/* Logo */}
          <Link
            href="/"
            className="text-lg font-extrabold tracking-wide text-amber-400 transition-colors duration-300 hover:text-amber-300 sm:text-xl"
          >
            RG Bowl
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 text-sm md:flex">
            <Link href="/contact" className={navLinkClass}>
              Contact
            </Link>

            {status === "loading" ? (
              <span className="text-zinc-500">…</span>
            ) : session ? (
              <>
                {role === "admin" && (
                  <Link href="/admin-app/orders" className="text-amber-300 transition-all duration-300 hover:text-amber-400 hover:scale-105 inline-block">
                    Admin
                  </Link>
                )}
                {role === "delivery" && (
                  <Link href="/delivery" className="text-amber-300 transition-all duration-300 hover:text-amber-400 hover:scale-105 inline-block">
                    Delivery
                  </Link>
                )}

                <Link href="/profile#orders" className={navLinkClass}>
                  My Orders
                </Link>

                {/* Profile dropdown */}
                <div ref={profileRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setProfileOpen((v) => !v)}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-zinc-200 transition-all duration-300 hover:border-amber-400/40 hover:text-amber-400"
                  >
                    <User size={16} />
                    <span className="max-w-[100px] truncate">{userName || "Profile"}</span>
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-300 ${profileOpen ? "rotate-180" : ""}`}
                    />
                  </button>

                  <AnimatePresence>
                    {profileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#0F172A] shadow-xl shadow-black/40"
                      >
                        <Link
                          href="/profile"
                          className="flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 transition-colors duration-200 hover:bg-white/5 hover:text-amber-400"
                        >
                          <User size={15} /> My Profile
                        </Link>
                        <Link
                          href="/profile#orders"
                          className="flex items-center gap-2.5 px-4 py-3 text-sm text-zinc-300 transition-colors duration-200 hover:bg-white/5 hover:text-amber-400"
                        >
                          <ShoppingBag size={15} /> My Orders
                        </Link>
                        <button
                          type="button"
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex w-full items-center gap-2.5 px-4 py-3 text-sm text-zinc-400 transition-colors duration-200 hover:bg-white/5 hover:text-red-400"
                        >
                          <LogOut size={15} /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className={navLinkClass}>
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black shadow-lg shadow-amber-400/20 transition-all duration-300 hover:scale-105 hover:bg-amber-300 hover:shadow-amber-400/30"
                >
                  Signup
                </Link>
              </>
            )}
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-zinc-300 transition-colors duration-200 hover:bg-white/10 hover:text-amber-400 md:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </motion.header>

      {/* Spacer so content doesn't hide behind the fixed navbar */}
      <div className="h-14 sm:h-16" />

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />

            {/* Drawer panel */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 z-[70] flex h-full w-72 flex-col bg-[#020617] shadow-2xl shadow-black/60"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <span className="text-lg font-extrabold tracking-wide text-amber-400">
                  RG Bowl
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors duration-200 hover:bg-white/10 hover:text-zinc-100"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Links */}
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
                <DrawerLink href="/contact" icon={<Phone size={18} />}>Contact</DrawerLink>

                {status === "loading" ? (
                  <span className="px-3 py-2 text-sm text-zinc-500">…</span>
                ) : session ? (
                  <>
                    {role === "admin" && (
                      <DrawerLink href="/admin-app/orders" icon={<Shield size={18} />} accent>
                        Admin
                      </DrawerLink>
                    )}
                    {role === "delivery" && (
                      <DrawerLink href="/delivery" icon={<Truck size={18} />} accent>
                        Delivery
                      </DrawerLink>
                    )}
                    <DrawerLink href="/profile#orders" icon={<ShoppingBag size={18} />}>My Orders</DrawerLink>
                    <DrawerLink href="/my-referrals" icon={<Gift size={18} />}>My Referrals</DrawerLink>
                    <DrawerLink href="/profile" icon={<User size={18} />}>Profile</DrawerLink>

                    <div className="my-2 border-t border-white/5" />

                    <button
                      type="button"
                      onClick={() => {
                        setDrawerOpen(false);
                        signOut({ callbackUrl: "/" });
                      }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-all duration-300 hover:bg-white/5 hover:text-red-400 hover:scale-[1.02]"
                    >
                      <LogOut size={18} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <DrawerLink href="/login" icon={<User size={18} />}>Login</DrawerLink>
                    <Link
                      href="/signup"
                      onClick={() => setDrawerOpen(false)}
                      className="mt-2 flex items-center justify-center rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-400/20 transition-all duration-300 hover:bg-amber-300"
                    >
                      Signup
                    </Link>
                  </>
                )}
              </nav>

              {/* Footer */}
              {session && (
                <div className="border-t border-white/5 px-5 py-3">
                  <p className="truncate text-xs text-zinc-500">
                    Signed in as <span className="text-zinc-300">{userName || "User"}</span>
                  </p>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function DrawerLink({
  href,
  icon,
  accent,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-300 hover:bg-white/5 hover:text-amber-400 hover:scale-[1.02] ${
        accent ? "text-amber-300" : "text-zinc-300"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
