"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function CreateDesignerAccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // lightweight client-side checks (nice UX; server still validates)
  const emailLooksValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);
  const passwordLooksValid = useMemo(() => password.length >= 8, [password]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!emailLooksValid) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!passwordLooksValid) {
      setError("Password must be at least 8 characters.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch("/api/create-designer-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // role is fixed to 'designer' by the API, so only send email/password
        body: JSON.stringify({ email, password }),
      });

      const payload = await res.json();

      if (!res.ok) {
        // Show server-provided error if available
        setError(payload?.error || "Failed to create account.");
        return;
      }

      setSuccess("Designer account created.");
      // brief success state then return to admin panel
      setTimeout(() => router.push("/adminpanel"), 800);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Floating header (mirrors Admin Panel) */}
      <div className="sticky top-0 z-20 px-4 sm:px-6 py-3">
        <div className="relative rounded-2xl border border-stone-200 bg-stone-50/90 backdrop-blur shadow-md">
          {/* Back / Exit */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Link
              href="/adminpanel"
              className="inline-flex items-center gap-2 text-stone-700 hover:text-stone-900"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Back</span>
            </Link>
          </div>

          {/* Title */}
          <div className="py-2.5 text-center">
            <h1 className="text-lg font-semibold tracking-tight text-stone-800">
              Create Designer Account
            </h1>
            <p className="text-[11px] text-stone-500">Add a new designer</p>
          </div>

          {/* Right side left empty for symmetry */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 pb-10">
        <div className="mx-auto max-w-md rounded-xl border border-stone-200 bg-stone-50 shadow-sm ring-1 ring-black/5 p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">
                User Email
              </label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="designer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              {!emailLooksValid && email.length > 0 && (
                <p className="mt-1 text-xs text-rose-600">Invalid email format.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700">
                User Password
              </label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-stone-900 placeholder-stone-400 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              {!passwordLooksValid && password.length > 0 && (
                <p className="mt-1 text-xs text-rose-600">
                  Use at least 8 characters.
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-stone-800 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Designer Account"}
            </button>

            {/* Tiny helper hint */}
            <p className="text-[11px] text-stone-500 text-center">
              Account will be created with role <span className="font-medium">designer</span>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
