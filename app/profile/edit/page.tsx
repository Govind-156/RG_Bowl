"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

const PHONE_REGEX = /^[6-9]\d{9}$/;

export default function EditProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user = session?.user as { name?: string | null; email?: string | null; phone?: string | null } | undefined;

  useEffect(() => {
    if (!user) return;
    setName((user.name ?? "").toString());
    setPhone((user.phone ?? "").toString());
  }, [user?.name, user?.phone]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/profile/edit");
    }
  }, [status, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const nameTrim = name.trim();
      const phoneTrim = phone.trim();
      if (!nameTrim) {
        setError("Name is required.");
        return;
      }
      if (!PHONE_REGEX.test(phoneTrim)) {
        setError("Enter a valid 10-digit Indian mobile number.");
        return;
      }

      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameTrim, phone: phoneTrim }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Failed to update profile.");
        return;
      }

      const wantPasswordChange =
        currentPassword.trim() !== "" && newPassword.trim() !== "";
      if (wantPasswordChange) {
        if (newPassword.trim().length < 6) {
          setError("New password must be at least 6 characters.");
          return;
        }
        const pwRes = await fetch("/api/me/password", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: currentPassword.trim(),
            newPassword: newPassword.trim(),
          }),
        });
        const pwData = (await pwRes.json()) as { error?: string };
        if (!pwRes.ok) {
          setError(pwData.error ?? "Failed to update password.");
          return;
        }
      }

      router.push("/profile?updated=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-zinc-400">
        <p>Loading…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-black px-6 py-12 text-zinc-50">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
        <h1 className="mb-4 text-xl font-semibold tracking-tight">
          Edit profile
        </h1>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
              placeholder="Your name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={(user?.email ?? "").toString()}
              readOnly
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-500 outline-none"
              aria-readonly
            />
            <p className="mt-1 text-xs text-zinc-500">
              Email cannot be changed.
            </p>
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
            >
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
              placeholder="10-digit mobile number"
              required
            />
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Change password (optional)
            </h2>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="mb-1 block text-xs font-medium text-zinc-500"
                >
                  Current password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-1 block text-xs font-medium text-zinc-500"
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
                />
              </div>
              <p className="text-xs text-zinc-500">
                Fill both fields only if you want to change your password.
              </p>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black shadow-md transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {isSubmitting ? "Saving…" : "Save changes"}
            </motion.button>
            <Link
              href="/profile"
              className="text-center text-sm text-zinc-400 hover:text-zinc-300"
            >
              <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
                Cancel
              </motion.span>
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
