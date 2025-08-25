"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    // Let the API clear the cookie + redirect to /login
    const res = await fetch("/api/logout", { method: "POST" });
    if (res.redirected) {
      router.push(res.url);
    } else {
      // Fallback: send them to login anyway
      router.push("/login");
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-2 rounded-md border text-sm"
    >
      Logout
    </button>
  );
}
