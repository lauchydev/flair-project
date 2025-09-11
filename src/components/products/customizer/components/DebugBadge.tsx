"use client";

import React from "react";

interface DebugBadgeProps {
    text: string;
}

export default function DebugBadge({ text }: DebugBadgeProps) {
    return (
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/70 px-2 py-1 text-xs font-black text-gray-700">
            {text}
        </div>
    );
}
