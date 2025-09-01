"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "admin" | "designer";

export default function CreateAccountPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("designer");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (!email || !password) { setMessage("Email and password are required."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.message || `Failed (${res.status})`);
      setMessage("✅ Account created successfully.");
      setTimeout(() => router.push("/adminpanel"), 1200);
    } catch (err: any) {
      setMessage(err.message || "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Create Account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            className="w-full border rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="designer@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            className="w-full border rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="designer">Designer</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {submitting ? "Creating..." : "Create Account"}
        </button>

        {message && <p className="text-sm mt-2">{message}</p>}
      </form>
    </div>
  );
}
