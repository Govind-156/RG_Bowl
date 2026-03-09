"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ProfileUpdatedBanner() {
  const searchParams = useSearchParams();
  const updated = searchParams.get("updated");

  if (updated !== "1") return null;

  return (
    <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
      <p className="font-medium">Profile updated.</p>
      <p className="mt-1 text-xs text-amber-200/80">
        Log out and log back in for your new name and phone to appear everywhere in the app.
      </p>
      <Link
        href="/profile"
        className="mt-2 inline-block text-xs font-medium text-amber-300 underline hover:text-amber-200"
      >
        Dismiss
      </Link>
    </div>
  );
}
