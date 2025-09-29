"use client";

import { useRouter } from "next/navigation";

type LogoutButtonProps = {
    className?: string;
};

export default function LogoutButton({ className }: LogoutButtonProps) {
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
            className={
                className ??
                "px-3 py-2 rounded-xl border-2 border-black bg-white hover:bg-red-100 text-sm font-semibold transition-colors"
            }
            aria-label="Logout"
        >
            Logout
        </button>
    );
}
