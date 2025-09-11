"use client";

import { useId } from "react";

interface ControlsPanelProps {
    children: React.ReactNode;
    title?: string;
}

export default function ControlsPanel({
    children,
    title = "Controls",
}: ControlsPanelProps) {
    const headingId = useId();
    return (
        <section
            aria-labelledby={headingId}
            className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl"
        >
            <h2 id={headingId} className="mb-3 text-lg font-black text-black">
                {title}
            </h2>
            {children}
        </section>
    );
}
