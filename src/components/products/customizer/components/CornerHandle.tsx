"use client";

import React from "react";

interface CornerHandleProps {
    position: "nw" | "ne" | "sw" | "se";
    className?: string;
    cursor?: string; // optional; inferred by default
    onDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    positionClassName?: string; // optional override for absolute positioning
}

/**
 * Draggable handle used for corner resize.
 */
export default function CornerHandle({
    position,
    className,
    cursor,
    onDown,
    positionClassName,
}: CornerHandleProps) {
    const base =
        "absolute h-4 w-4 rounded-full border-2 border-blue-500 bg-white";
    let posClass = positionClassName ?? "";
    if (!positionClassName) {
        switch (position) {
            case "nw":
                posClass = "-left-2 -top-2";
                break;
            case "ne":
                posClass = "-right-2 -top-2";
                break;
            case "sw":
                posClass = "-left-2 -bottom-2";
                break;
            case "se":
                posClass = "-right-2 -bottom-2";
                break;
        }
    }
    const inferredCursor =
        cursor ??
        (position === "nw" || position === "se"
            ? "nwse-resize"
            : "nesw-resize");
    return (
        <div
            onPointerDown={onDown}
            className={`${base} ${posClass} ${className ?? ""}`}
            style={{ cursor: inferredCursor }}
        />
    );
}
