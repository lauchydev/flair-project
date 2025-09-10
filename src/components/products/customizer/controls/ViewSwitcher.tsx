"use client";

import type { ViewPose } from "../types";

interface ViewSwitcherProps {
    views: ViewPose[];
    selected: ViewPose;
    onSelect: (v: ViewPose) => void;
}

export default function ViewSwitcher({
    views,
    selected,
    onSelect,
}: ViewSwitcherProps) {
    if (!views.length) return null;
    return (
        <div className="mb-3 flex gap-2 justify-center">
            {views.map((pose) => (
                <button
                    key={pose}
                    onClick={() => onSelect(pose)}
                    className={`rounded-xl border-2 px-3 py-2 text-xs font-black uppercase tracking-wide cursor-pointer transition-colors ${
                        selected === pose
                            ? "bg-lime-400 text-black border-black"
                            : "bg-white text-black border-black hover:bg-gray-50"
                    }`}
                >
                    {pose}
                </button>
            ))}
        </div>
    );
}
