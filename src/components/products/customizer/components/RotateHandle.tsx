"use client";

import React from "react";

interface RotateHandleProps {
    angleDeg: number;
    onStart: (e: React.PointerEvent<HTMLDivElement>) => void;
    children?: React.ReactNode;
}

/**
 * Rotate control with percentage indicator.
 */
export default function RotateHandle({
    angleDeg,
    onStart,
    children,
}: RotateHandleProps) {
    return (
        <div className="absolute left-1/2 bottom-[-32px] -translate-x-1/2">
            <div
                className="flex items-center gap-2"
                style={{ transform: `rotate(${-angleDeg}deg)` }}
            >
                <div
                    onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onStart(e);
                    }}
                    className="h-8 w-8 rounded-xl border-2 border-blue-500 bg-white flex items-center justify-center text-gray-800"
                    style={{ cursor: "grab" }}
                >
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <path d="M21 12a9 9 0 1 1-3.51-7.1" />
                        <polyline points="21 3 21 9 15 9" />
                    </svg>
                </div>
                {children}
                <div
                    className="h-8 px-2 flex items-center justify-center text-xs font-bold text-blue-700 select-none pointer-events-none border-2 border-blue-500 rounded-md bg-white shadow-sm"
                    style={{
                        fontSize: 12,
                        lineHeight: 1,
                        fontFamily:
                            "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
                    }}
                >
                    {Math.round(((((angleDeg % 360) + 360) % 360) / 360) * 100)}
                    %
                </div>
            </div>
        </div>
    );
}
