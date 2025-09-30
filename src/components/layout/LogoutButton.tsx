"use client";

import { useRouter } from "next/navigation";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

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
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-black/10 bg-white hover:bg-gray-50 text-sm font-semibold transition-colors cursor-pointer"
            }
            aria-label="Logout"
        >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            Logout
        </button>
    );
}
