"use client";

import { FormEvent, useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

export default function ContactPage() {
  const { data: session } = useSession();
  const user = session?.user as { name?: string | null; email?: string | null } | undefined;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [type, setType] = useState<"GENERAL" | "COMPLAINT">("GENERAL");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName((user.name ?? "").toString());
    setEmail((user.email ?? "").toString());
  }, [user?.name, user?.email]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim() || undefined,
            email: email.trim(),
            message: message.trim(),
            orderId: orderId.trim() || undefined,
            type,
            imageUrl: imageUrl || undefined,
          }),
      });
      const data = (await res.json()) as { error?: string; message?: string };

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      setMessage("");
      setOrderId("");
      setType("GENERAL");
      setImageUrl(null);
      setUploadError(null);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black px-4 py-12 text-zinc-50 sm:px-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Contact us
        </h1>
        <p className="mb-8 text-sm text-zinc-400">
          Have a question or issue? Send us a message and we&apos;ll get back to you.
        </p>

        {success ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6">
            <p className="text-sm text-amber-200">
              Thanks, we&apos;ll get back to you.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm font-medium text-amber-400 hover:text-amber-300"
            >
              ← Back to Home
            </Link>
          </div>
        ) : (
          <form
            className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="contact-type-general"
                  className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
                >
                  Reason
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  <motion.button
                    type="button"
                    onClick={() => setType("GENERAL")}
                    className={`rounded-full border px-3 py-1.5 ${
                      type === "GENERAL"
                        ? "border-amber-400 bg-amber-400/10 text-amber-300"
                        : "border-zinc-700 bg-zinc-900 text-zinc-300"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    General question / feedback
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => setType("COMPLAINT")}
                    className={`rounded-full border px-3 py-1.5 ${
                      type === "COMPLAINT"
                        ? "border-red-400 bg-red-500/10 text-red-300"
                        : "border-zinc-700 bg-zinc-900 text-zinc-300"
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    Order complaint / damage
                  </motion.button>
                </div>
              </div>

              <label
                htmlFor="contact-name"
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Name (optional)
              </label>
              <input
                id="contact-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
                placeholder="Your name"
              />
            </div>

            <div>
              <label
                htmlFor="contact-email"
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
                placeholder="you@example.com"
                required
              />
            </div>

            {type === "COMPLAINT" && (
              <div className="space-y-2 rounded-lg border border-red-500/30 bg-red-950/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-red-300">
                  Complaint details
                </p>
                <p className="text-xs text-red-100/80">
                  If you received a damaged order, upload a clear photo of the item or packaging.
                  This helps us resolve it faster. The photo is optional but recommended.
                </p>
                <div className="flex flex-col gap-2 text-xs">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) {
                        return;
                      }
                      setUploadError(null);
                      setUploading(true);
                      try {
                        const formData = new FormData();
                        formData.append("file", file);
                        const res = await fetch("/api/contact/upload-image", {
                          method: "POST",
                          body: formData,
                        });
                        const data = (await res.json()) as {
                          error?: string;
                          url?: string;
                        };
                        if (!res.ok || !data.url) {
                          setUploadError(
                            data.error ||
                              "Could not upload image. Please try again.",
                          );
                          setImageUrl(null);
                        } else {
                          setImageUrl(data.url);
                        }
                      } catch {
                        setUploadError(
                          "Could not upload image. Please try again.",
                        );
                        setImageUrl(null);
                      } finally {
                        setUploading(false);
                      }
                    }}
                    className="block w-full text-xs text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-zinc-100 hover:file:bg-zinc-700"
                  />
                  {uploading && (
                    <p className="text-xs text-zinc-300">Uploading image…</p>
                  )}
                  {imageUrl && !uploading && (
                    <p className="text-xs text-emerald-400">
                      Image attached. We&apos;ll review it with your complaint.
                    </p>
                  )}
                  {uploadError && (
                    <p className="text-xs text-red-400">{uploadError}</p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="contact-message"
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Message <span className="text-red-400">*</span>
              </label>
              <textarea
                id="contact-message"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
                placeholder="How can we help?"
                required
              />
            </div>

            <div>
              <label
                htmlFor="contact-orderId"
                className="mb-1 block text-xs font-medium uppercase tracking-wide text-zinc-500"
              >
                Order ID (if about an order)
              </label>
              <input
                id="contact-orderId"
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-amber-400"
                placeholder="e.g. from your order confirmation"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-amber-400 px-4 py-2.5 text-sm font-semibold text-black shadow-md transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {isSubmitting ? "Sending…" : "Send message"}
            </motion.button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-zinc-500">
          <Link href="/" className="text-amber-400 hover:text-amber-300">
            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              ← Back to Home
            </motion.span>
          </Link>
        </p>
      </div>
    </main>
  );
}
