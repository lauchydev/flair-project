"use client";

import React from "react";
import Image from "next/image";

export type PercentRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

interface DesignAreaOutlineProps {
    area: PercentRect;
}

export function DesignAreaOutline({ area }: DesignAreaOutlineProps) {
    return (
        <div
            className="absolute border-2 border-dashed border-blue-500 pointer-events-none"
            style={{
                left: `${area.x}%`,
                top: `${area.y}%`,
                width: `${area.width}%`,
                height: `${area.height}%`,
            }}
        />
    );
}

interface DesignAreaClipProps {
    area: PercentRect;
    zIndex?: number;
    children: React.ReactNode;
}

export function DesignAreaClip({
    area,
    zIndex = 0,
    children,
}: DesignAreaClipProps) {
    return (
        <div
            className="absolute"
            style={{
                left: `${area.x}%`,
                top: `${area.y}%`,
                width: `${area.width}%`,
                height: `${area.height}%`,
                overflow: "hidden",
                pointerEvents: "none",
                zIndex,
            }}
        >
            {children}
        </div>
    );
}

// Helpers for positioning clipped content relative to the design area
const CANVAS_PX = 800;

function relativePx(valuePct: number, offsetPct: number): string {
    return `${(valuePct / 100) * CANVAS_PX - (offsetPct / 100) * CANVAS_PX}px`;
}

interface ClippedTextProps {
    area: PercentRect;
    text: string;
    pos: { x: number; y: number };
    widthPercent: number;
    heightPercent: number;
    angleDeg: number;
    fontFamily?: string;
    color?: string;
    zIndex?: number;
}

export function ClippedText({
    area,
    text,
    pos,
    widthPercent,
    heightPercent,
    angleDeg,
    fontFamily,
    color,
    zIndex = 1,
}: ClippedTextProps) {
    const fontSize = Math.max(
        8,
        Math.min(Math.floor(800 * 0.8 * (heightPercent / 100)), 200)
    );
    return (
        <div
            style={{
                position: "absolute",
                left: relativePx(pos.x, area.x),
                top: relativePx(pos.y, area.y),
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
                fontFamily,
                color,
                width: `${(widthPercent / 100) * CANVAS_PX}px`,
                height: "auto",
                zIndex,
            }}
        >
            <div
                className="w-full text-center"
                style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.1,
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    overflow: "visible",
                }}
            >
                {text}
            </div>
        </div>
    );
}

interface ClippedImageProps {
    area: PercentRect;
    url: string;
    pos: { x: number; y: number };
    widthPercent: number;
    heightPercent: number;
    angleDeg: number;
    zIndex?: number;
}

export function ClippedImage({
    area,
    url,
    pos,
    widthPercent,
    heightPercent,
    angleDeg,
    zIndex = 1,
}: ClippedImageProps) {
    return (
        <div
            style={{
                position: "absolute",
                left: relativePx(pos.x, area.x),
                top: relativePx(pos.y, area.y),
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
                width: `${(widthPercent / 100) * CANVAS_PX}px`,
                height: `${(heightPercent / 100) * CANVAS_PX}px`,
                zIndex,
            }}
            className="select-none"
        >
            <Image
                src={url}
                alt="Overlay"
                fill
                className="object-contain"
                sizes="96px"
            />
        </div>
    );
}
