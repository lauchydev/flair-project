"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function AddUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function isValidEmail(v: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    if (!isValidEmail(email)) return setError("Please enter a valid email.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/add-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(async () => ({ body: await res.text() }));
      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) ||
          (typeof data.body === "string" ? data.body : "Failed to create user.");
        setError(msg);
        return;
      }
      setOk("User created successfully.");
      setTimeout(() => router.push("/adminpanel"), 800);
    } catch (err: any) {
      setError(err?.message || "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 p-6">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <Link href="/adminpanel" className="inline-flex items-center gap-2 text-gray-600 hover:text-black">
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Admin Panel
          </Link>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white shadow p-6">
          <h1 className="text-2xl font-semibold mb-1">Add User</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="designer@company.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Password</label>
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-stone-300 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="text-sm text-rose-600">{error}</div>}
            {ok && <div className="text-sm text-green-700">{ok}</div>}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex items-center justify-center rounded-md bg-black text-white px-4 py-2 ${
                  submitting ? "opacity-70 cursor-not-allowed" : "hover:bg-stone-800"
                }`}
              >
                {submitting ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
