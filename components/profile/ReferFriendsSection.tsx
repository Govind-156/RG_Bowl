"use client";

import { useEffect, useState } from "react";

export default function ReferFriendsSection() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/referral-status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.referralCode) setReferralCode(data.referralCode);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const referralLink =
    referralCode && typeof window !== "undefined"
      ? `${window.location.origin}/signup?ref=${encodeURIComponent(referralCode)}`
      : referralCode
        ? `/signup?ref=${encodeURIComponent(referralCode)}`
        : "";

  const handleCopy = () => {
    if (!referralLink) return;
    const full = referralLink.startsWith("http") ? referralLink : `${typeof window !== "undefined" ? window.location.origin : ""}${referralLink}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div id="refer" className="mt-8">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
        Refer friends
      </h2>
      <p className="mb-3 text-xs text-zinc-500">
        Refer 3 friends who place an order to get a free Classic Maggi. Your
        friends get 25% off their first order.
      </p>
      {referralCode ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="mb-2 text-xs font-medium text-zinc-400">Your referral link</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-300 outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full border border-amber-400/60 bg-amber-400/10 px-4 py-2 text-xs font-medium text-amber-300 transition hover:bg-amber-400/20"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-zinc-500">Loading your link…</p>
      )}
    </div>
  );
}
