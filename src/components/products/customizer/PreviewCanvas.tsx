"use client";

import Image from "next/image";
import type { ViewPose } from "./types";

// types inside PreviewCanvas.tsx
type PercentPos = { x: number; y: number };
type PercentRect = { x: number; y: number; width: number; height: number };

interface PreviewCanvasProps {
    backgroundUrl: string;
    backgroundAlt: string;
    view: ViewPose;

    colorHex: string | null;

    text: string;
    textPosition: PercentPos;
    onTextPositionChange?: (pos: PercentPos) => void;

    uploadedImageUrl: string | null;
    imagePosition: PercentPos;
    onImagePositionChange?: (pos: PercentPos) => void;

    draggable?: boolean;

    designArea?: PercentRect; // e.g. { x: 20, y: 8, width: 60, height: 70 }
    showDesignArea?: boolean; // dashed overlay toggle
    constrainToDesignArea?: boolean; // clamp dragging inside area
}

export default function PreviewCanvas({
    backgroundUrl,
    backgroundAlt,
    view,
    colorHex,
    text,
    textPosition,
    onTextPositionChange,
    uploadedImageUrl,
    imagePosition,
    onImagePositionChange,
    draggable = true,
    designArea,
    showDesignArea,
    constrainToDesignArea,
}: PreviewCanvasProps) {
    let activeDrag: "text" | "image" | null = null;

    const onPointerDown =
        (target: "text" | "image") =>
        (e: React.PointerEvent<HTMLDivElement | HTMLImageElement>) => {
            if (!draggable) return;
            activeDrag = target;
            (e.target as Element).setPointerCapture?.(e.pointerId);
        };

    const clampToArea = (x: number, y: number): PercentPos => {
        if (!constrainToDesignArea || !designArea) {
            return {
                x: Math.min(100, Math.max(0, x)),
                y: Math.min(100, Math.max(0, y)),
            };
        }
        const minX = designArea.x;
        const maxX = designArea.x + designArea.width;
        const minY = designArea.y;
        const maxY = designArea.y + designArea.height;
        return {
            x: Math.min(maxX, Math.max(minX, x)),
            y: Math.min(maxY, Math.max(minY, y)),
        };
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggable || !activeDrag) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        const { x, y } = clampToArea(px, py);

        if (activeDrag === "text" && onTextPositionChange)
            onTextPositionChange({ x, y });
        else if (activeDrag === "image" && onImagePositionChange)
            onImagePositionChange({ x, y });
    };

    const onPointerUp = () => {
        activeDrag = null;
    };

    return (
        <div
            className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-black bg-gradient-to-br from-gray-50 to-gray-100 touch-none"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
        >
            <Image
                src={backgroundUrl}
                alt={backgroundAlt}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 66vw"
            />

            {colorHex && (
                <div
                    className="absolute inset-0 mix-blend-multiply opacity-60 pointer-events-none"
                    style={{ backgroundColor: colorHex }}
                />
            )}

            {text && (
                <div
                    onPointerDown={onPointerDown("text")}
                    style={{
                        position: "absolute",
                        left: `${textPosition.x}%`,
                        top: `${textPosition.y}%`,
                        transform: "translate(-50%, -50%)",
                        cursor: draggable ? "grab" : "default",
                    }}
                    className="rounded-xl border-2 border-black bg-white/70 px-3 py-1 text-sm font-black text-black shadow select-none"
                >
                    {text}
                </div>
            )}

            {uploadedImageUrl && (
                <div
                    onPointerDown={onPointerDown("image")}
                    style={{
                        position: "absolute",
                        left: `${imagePosition.x}%`,
                        top: `${imagePosition.y}%`,
                        transform: "translate(-50%, -50%)",
                        cursor: draggable ? "grab" : "default",
                        width: "96px",
                        height: "96px",
                    }}
                    className="rounded-lg border-2 border-black shadow overflow-hidden select-none"
                >
                    <Image
                        src={uploadedImageUrl}
                        alt="Overlay"
                        fill
                        className="object-cover"
                        sizes="96px"
                    />
                </div>
            )}

            {showDesignArea && designArea && (
                <div
                    className="absolute border-2 border-dashed border-blue-500 pointer-events-none"
                    style={{
                        left: `${designArea.x}%`,
                        top: `${designArea.y}%`,
                        width: `${designArea.width}%`,
                        height: `${designArea.height}%`,
                    }}
                />
            )}

            <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/70 px-2 py-1 text-xs font-black text-gray-700">
                {view}
            </div>
        </div>
    );
}
