"use client";

import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import type { ViewPose } from "./types";
import CornerHandle from "./components/CornerHandle";
import RotateHandle from "./components/RotateHandle";
import {
    clampToCanvas as clampXY,
    clientToPercent,
    pointerAngleDeg,
    softSnapCenterToRectWithCenter,
    isOverlayFullyOutsideRect,
} from "./geometry";

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
    textColor?: string;
    textFont?: string;
    textWidthPercent?: number; // % of canvas width
    onTextWidthPercentChange?: (w: number) => void;
    textHeightPercent?: number; // % of canvas height
    onTextHeightPercentChange?: (h: number) => void;
    textAngleDeg?: number;
    onTextAngleDegChange?: (deg: number) => void;

    uploadedImageUrl: string | null;
    imagePosition: PercentPos;
    onImagePositionChange?: (pos: PercentPos) => void;
    imageWidthPercent?: number;
    imageHeightPercent?: number;
    onImageWidthPercentChange?: (w: number) => void;
    onImageHeightPercentChange?: (h: number) => void;
    imageAngleDeg?: number;
    onImageAngleDegChange?: (deg: number) => void;

    draggable?: boolean;

    designArea?: PercentRect; // e.g. { x: 20, y: 8, width: 60, height: 70 }
    showDesignArea?: boolean; // dashed overlay toggle
    // constrainToDesignArea?: boolean; // unused now
}

export default function PreviewCanvas({
    backgroundUrl,
    backgroundAlt,
    view,
    text,
    textPosition,
    onTextPositionChange,
    textColor = "#000000",
    textFont,
    textWidthPercent = 40,
    onTextWidthPercentChange,
    textHeightPercent = 12,
    onTextHeightPercentChange,
    textAngleDeg = 0,
    onTextAngleDegChange,
    uploadedImageUrl,
    imagePosition,
    onImagePositionChange,
    imageWidthPercent = 20,
    imageHeightPercent = 20,
    onImageWidthPercentChange,
    onImageHeightPercentChange,
    imageAngleDeg = 0,
    onImageAngleDegChange,
    draggable = true,
    designArea,
    showDesignArea,
}: PreviewCanvasProps) {
    const CANVAS_PX = 800;
    const [selected, setSelected] = useState<"text" | "image" | null>(null);
    const [topLayer, setTopLayer] = useState<"text" | "image" | null>(null);
    type ResizeStart = {
        handle: "nw" | "ne" | "sw" | "se";
        w: number;
        h: number;
        cx: number;
        cy: number;
        px0: number;
        py0: number;
        target: "text" | "image";
    };
    type Interaction =
        | { kind: "move"; offset: PercentPos }
        | { kind: "image-move"; offset: PercentPos }
        | { kind: "resize"; start: ResizeStart }
        | {
              kind: "rotate";
              target: "text" | "image";
              centerPx: { cx: number; cy: number };
              startAngleDeg: number;
              startPointerAngleDeg: number;
          };

    const activeDragRef = useRef<Interaction | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const textRef = useRef<HTMLDivElement | null>(null);
    const textContentRef = useRef<HTMLDivElement | null>(null);
    const imageRef = useRef<HTMLDivElement | null>(null);
    const imageAspectRef = useRef<number | null>(null);
    const textAspectRef = useRef<number | null>(null);

    useEffect(() => {
        if (!uploadedImageUrl) {
            imageAspectRef.current = null;
            return;
        }
        const img = new window.Image();
        img.onload = () => {
            if (img.naturalWidth && img.naturalHeight) {
                imageAspectRef.current = img.naturalWidth / img.naturalHeight;
            }
        };
        img.src = uploadedImageUrl;
    }, [uploadedImageUrl]);

    const onPointerDown =
        (target: "text" | "image") =>
        (e: React.PointerEvent<HTMLDivElement | HTMLImageElement>) => {
            if (!draggable) return;
            e.preventDefault();
            e.stopPropagation();
            setSelected(target);
            setTopLayer(target);
            if (target === "text") {
                const rect = (
                    containerRef.current as HTMLDivElement
                ).getBoundingClientRect();
                const px = ((e.clientX - rect.left) / rect.width) * 100;
                const py = ((e.clientY - rect.top) / rect.height) * 100;
                activeDragRef.current = {
                    kind: "move",
                    offset: { x: px - textPosition.x, y: py - textPosition.y },
                };
            } else {
                const rect = (
                    containerRef.current as HTMLDivElement
                ).getBoundingClientRect();
                const px = ((e.clientX - rect.left) / rect.width) * 100;
                const py = ((e.clientY - rect.top) / rect.height) * 100;
                activeDragRef.current = {
                    kind: "image-move",
                    offset: {
                        x: px - imagePosition.x,
                        y: py - imagePosition.y,
                    },
                };
            }
            containerRef.current?.setPointerCapture?.(e.pointerId);
        };

    // Helper to clamp to canvas bounds only (0-100)
    const clampToCanvas = (x: number, y: number): PercentPos => clampXY(x, y);

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggable || !activeDragRef.current) return;

        const rect = (
            containerRef.current || e.currentTarget
        ).getBoundingClientRect();
        const px = ((e.clientX - rect.left) / rect.width) * 100;
        const py = ((e.clientY - rect.top) / rect.height) * 100;
        const interaction = activeDragRef.current;
        if (interaction.kind === "move") {
            const { x, y } = clampToCanvas(
                px - interaction.offset.x,
                py - interaction.offset.y
            );
            let nx = x;
            let ny = y;
            if (designArea) {
                const halfW = (textWidthPercent ?? 0) / 2;
                const halfH = (textHeightPercent ?? 0) / 2;
                const snapped = softSnapCenterToRectWithCenter(
                    nx,
                    ny,
                    halfW,
                    halfH,
                    designArea
                );
                nx = snapped.x;
                ny = snapped.y;
            }
            onTextPositionChange?.({ x: nx, y: ny });
        } else if (interaction.kind === "image-move") {
            const { x, y } = clampToCanvas(
                px - interaction.offset.x,
                py - interaction.offset.y
            );
            let nx = x;
            let ny = y;
            if (designArea) {
                const halfW = (imageWidthPercent ?? 0) / 2;
                const halfH = (imageHeightPercent ?? 0) / 2;
                const snapped = softSnapCenterToRectWithCenter(
                    nx,
                    ny,
                    halfW,
                    halfH,
                    designArea
                );
                nx = snapped.x;
                ny = snapped.y;
            }
            onImagePositionChange?.({ x: nx, y: ny });
        } else if (interaction.kind === "resize") {
            const s = interaction.start;
            const dx = px - s.px0;
            const dy = py - s.py0;
            const sx = s.handle === "ne" || s.handle === "se" ? 1 : -1;
            const sy = s.handle === "sw" || s.handle === "se" ? 1 : -1;
            let newW = Math.max(5, Math.min(100, s.w + 2 * sx * dx));
            let newH = Math.max(5, Math.min(100, s.h + 2 * sy * dy));
            // Maintain aspect ratio when resizing image or text
            if (s.target === "image" && imageAspectRef.current) {
                const ar = imageAspectRef.current;
                const currentRatio = newW / Math.max(1e-6, newH);
                if (currentRatio > ar)
                    newW = Math.max(5, Math.min(100, newH * ar));
                else newH = Math.max(5, Math.min(100, newW / ar));
            }
            if (s.target === "text" && textAspectRef.current) {
                const ar = textAspectRef.current; // width/height
                const currentRatio = newW / Math.max(1e-6, newH);
                if (currentRatio > ar)
                    newW = Math.max(5, Math.min(100, newH * ar));
                else newH = Math.max(5, Math.min(100, newW / ar));
            }
            const cx = s.cx + ((newW - s.w) / 2) * sx;
            const cy = s.cy + ((newH - s.h) / 2) * sy;
            if (s.target === "text") {
                onTextWidthPercentChange?.(newW);
                onTextHeightPercentChange?.(newH);
                onTextPositionChange?.(clampToCanvas(cx, cy));
            } else {
                onImageWidthPercentChange?.(newW);
                onImageHeightPercentChange?.(newH);
                onImagePositionChange?.(clampToCanvas(cx, cy));
            }
        } else if (interaction.kind === "rotate") {
            const currentPointerAngleDeg =
                (Math.atan2(
                    e.clientY - interaction.centerPx.cy,
                    e.clientX - interaction.centerPx.cx
                ) *
                    180) /
                Math.PI;
            let next =
                interaction.startAngleDeg +
                (currentPointerAngleDeg - interaction.startPointerAngleDeg);
            // Normalize to [-180, 180] for stability
            if (next > 180) next -= 360;
            if (next <= -180) next += 360;
            if (interaction.target === "text") {
                onTextAngleDegChange?.(Math.round(next));
            } else {
                onImageAngleDegChange?.(Math.round(next));
            }
        }
    };

    /**
     * Resize initializer for both text and image overlays
     */
    const startResize = (
        target: "text" | "image",
        handle: "nw" | "ne" | "sw" | "se",
        e: React.PointerEvent<HTMLDivElement>
    ) => {
        if (!draggable) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = (
            containerRef.current as HTMLDivElement
        ).getBoundingClientRect();
        const { x: px0, y: py0 } = clientToPercent(e.clientX, e.clientY, rect);
        if (target === "text") {
            textAspectRef.current =
                textWidthPercent / Math.max(1e-6, textHeightPercent);
            activeDragRef.current = {
                kind: "resize",
                start: {
                    handle,
                    w: textWidthPercent,
                    h: textHeightPercent,
                    cx: textPosition.x,
                    cy: textPosition.y,
                    px0,
                    py0,
                    target: "text",
                },
            };
        } else {
            activeDragRef.current = {
                kind: "resize",
                start: {
                    handle,
                    w: imageWidthPercent,
                    h: imageHeightPercent,
                    cx: imagePosition.x,
                    cy: imagePosition.y,
                    px0,
                    py0,
                    target: "image",
                },
            };
        }
        containerRef.current?.setPointerCapture?.(e.pointerId);
    };

    const onPointerUp = () => {
        const interaction = activeDragRef.current;
        activeDragRef.current = null;
        if (!designArea) return;
        // On release, if the whole overlay is outside the design area, reset to center
        const centerX = designArea.x + designArea.width / 2;
        const centerY = designArea.y + designArea.height / 2;
        if (interaction?.kind === "move") {
            const halfW = (textWidthPercent ?? 0) / 2;
            const halfH = (textHeightPercent ?? 0) / 2;
            if (
                isOverlayFullyOutsideRect(
                    textPosition.x,
                    textPosition.y,
                    halfW,
                    halfH,
                    designArea
                )
            ) {
                onTextPositionChange?.({ x: centerX, y: centerY });
            }
        } else if (interaction?.kind === "image-move") {
            const halfW = (imageWidthPercent ?? 0) / 2;
            const halfH = (imageHeightPercent ?? 0) / 2;
            if (
                isOverlayFullyOutsideRect(
                    imagePosition.x,
                    imagePosition.y,
                    halfW,
                    halfH,
                    designArea
                )
            ) {
                onImagePositionChange?.({ x: centerX, y: centerY });
            }
        }
    };

    return (
        <div
            className="relative overflow-hidden rounded-2xl border-2 border-black bg-gradient-to-br from-gray-50 to-gray-100 touch-none"
            style={{ width: 800, height: 800 }}
            ref={containerRef}
            onPointerDown={() => setSelected(null)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onPointerLeave={onPointerUp}
        >
            <Image
                src={backgroundUrl}
                alt={backgroundAlt}
                fill
                className="object-contain select-none pointer-events-none"
                sizes="(max-width: 1024px) 100vw, 66vw"
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
            />

            {/* Removed color overlay; color selection no longer tints the preview */}

            {text && (
                <div
                    ref={textRef}
                    onPointerDown={onPointerDown("text")}
                    style={{
                        position: "absolute",
                        left: `${textPosition.x}%`,
                        top: `${textPosition.y}%`,
                        transform: `translate(-50%, -50%) rotate(${textAngleDeg}deg)`,
                        cursor: draggable ? "grab" : "default",
                        fontFamily: textFont,
                        color: textColor,
                        userSelect: "none",
                        width: `${textWidthPercent}%`,
                        height: `${textHeightPercent}%`,
                        zIndex: topLayer === "text" ? 20 : 10,
                    }}
                >
                    {selected === "text" ? (
                        <div className="relative w-full h-full border-2 border-dashed border-blue-500 rounded-md shadow">
                            <div
                                className={`w-full h-full flex items-center justify-center text-center ${
                                    designArea ? "invisible" : ""
                                }`}
                                ref={textContentRef}
                                style={{
                                    fontSize: `${Math.max(
                                        8,
                                        Math.min(
                                            Math.floor(
                                                800 *
                                                    0.8 *
                                                    (textHeightPercent / 100)
                                            ),
                                            200
                                        )
                                    )}px`,
                                    lineHeight: 1.1,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "clip",
                                }}
                            >
                                {text}
                            </div>
                            <CornerHandle
                                position="nw"
                                positionClassName="left-0 top-0 -translate-x-1/2 -translate-y-1/2"
                                onDown={(e) => startResize("text", "nw", e)}
                            />
                            <CornerHandle
                                position="ne"
                                positionClassName="right-0 top-0 translate-x-1/2 -translate-y-1/2"
                                onDown={(e) => startResize("text", "ne", e)}
                            />
                            <CornerHandle
                                position="sw"
                                positionClassName="left-0 bottom-0 -translate-x-1/2 translate-y-1/2"
                                onDown={(e) => startResize("text", "sw", e)}
                            />
                            <CornerHandle
                                position="se"
                                positionClassName="right-0 bottom-0 translate-x-1/2 translate-y-1/2"
                                onDown={(e) => startResize("text", "se", e)}
                            />
                            {onTextAngleDegChange && (
                                <RotateHandle
                                    angleDeg={textAngleDeg}
                                    onStart={(e) => {
                                        if (!draggable) return;
                                        const box = (
                                            textRef.current as HTMLDivElement
                                        ).getBoundingClientRect();
                                        const cx = box.left + box.width / 2;
                                        const cy = box.top + box.height / 2;
                                        const startPointerAngleDeg =
                                            pointerAngleDeg(
                                                cx,
                                                cy,
                                                e.clientX,
                                                e.clientY
                                            );
                                        activeDragRef.current = {
                                            kind: "rotate",
                                            target: "text",
                                            centerPx: { cx, cy },
                                            startAngleDeg: textAngleDeg,
                                            startPointerAngleDeg,
                                        };
                                        containerRef.current?.setPointerCapture?.(
                                            e.pointerId
                                        );
                                    }}
                                />
                            )}
                        </div>
                    ) : (
                        <div
                            className={`w-full h-full flex items-center justify-center text-center ${
                                designArea ? "invisible" : ""
                            }`}
                            ref={textContentRef}
                            style={{
                                fontSize: `${Math.max(
                                    8,
                                    Math.min(
                                        Math.floor(
                                            800 *
                                                0.8 *
                                                (textHeightPercent / 100)
                                        ),
                                        200
                                    )
                                )}px`,
                                lineHeight: 1.1,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "clip",
                            }}
                        >
                            {text}
                        </div>
                    )}
                </div>
            )}

            {uploadedImageUrl && (
                <div
                    ref={imageRef}
                    onPointerDown={onPointerDown("image")}
                    style={{
                        position: "absolute",
                        left: `${imagePosition.x}%`,
                        top: `${imagePosition.y}%`,
                        transform: `translate(-50%, -50%) rotate(${imageAngleDeg}deg)`,
                        cursor: draggable ? "grab" : "default",
                        width: `${imageWidthPercent}%`,
                        height: `${imageHeightPercent}%`,
                        zIndex: topLayer === "image" ? 20 : 10,
                    }}
                    className={`rounded-md ${
                        selected === "image"
                            ? "border-2 border-blue-500 border-dashed"
                            : "border-0"
                    } shadow select-none`}
                >
                    <Image
                        src={uploadedImageUrl}
                        alt="Overlay"
                        fill
                        className={`object-contain ${
                            designArea ? "invisible" : ""
                        }`}
                        sizes="96px"
                    />
                    {selected === "image" &&
                        onImageWidthPercentChange &&
                        onImageHeightPercentChange && (
                            <>
                                <CornerHandle
                                    position="nw"
                                    positionClassName="left-0 top-0 -translate-x-1/2 -translate-y-1/2"
                                    onDown={(e) =>
                                        startResize("image", "nw", e)
                                    }
                                />
                                <CornerHandle
                                    position="ne"
                                    positionClassName="right-0 top-0 translate-x-1/2 -translate-y-1/2"
                                    onDown={(e) =>
                                        startResize("image", "ne", e)
                                    }
                                />
                                <CornerHandle
                                    position="sw"
                                    positionClassName="left-0 bottom-0 -translate-x-1/2 translate-y-1/2"
                                    onDown={(e) =>
                                        startResize("image", "sw", e)
                                    }
                                />
                                <CornerHandle
                                    position="se"
                                    positionClassName="right-0 bottom-0 translate-x-1/2 translate-y-1/2"
                                    onDown={(e) =>
                                        startResize("image", "se", e)
                                    }
                                />
                                {onImageAngleDegChange && (
                                    <RotateHandle
                                        angleDeg={imageAngleDeg}
                                        onStart={(e) => {
                                            if (!draggable) return;
                                            const box = (
                                                imageRef.current as HTMLDivElement
                                            ).getBoundingClientRect();
                                            const cx = box.left + box.width / 2;
                                            const cy = box.top + box.height / 2;
                                            const startPointerAngleDeg =
                                                pointerAngleDeg(
                                                    cx,
                                                    cy,
                                                    e.clientX,
                                                    e.clientY
                                                );
                                            activeDragRef.current = {
                                                kind: "rotate",
                                                target: "image",
                                                centerPx: { cx, cy },
                                                startAngleDeg: imageAngleDeg,
                                                startPointerAngleDeg,
                                            };
                                            containerRef.current?.setPointerCapture?.(
                                                e.pointerId
                                            );
                                        }}
                                    />
                                )}
                            </>
                        )}
                </div>
            )}

            {designArea && (
                <div
                    className="absolute"
                    style={{
                        left: `${designArea.x}%`,
                        top: `${designArea.y}%`,
                        width: `${designArea.width}%`,
                        height: `${designArea.height}%`,
                        overflow: "hidden",
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                >
                    {text && (
                        <div
                            style={{
                                position: "absolute",
                                left: `${
                                    (textPosition.x / 100) * CANVAS_PX -
                                    (designArea.x / 100) * CANVAS_PX
                                }px`,
                                top: `${
                                    (textPosition.y / 100) * CANVAS_PX -
                                    (designArea.y / 100) * CANVAS_PX
                                }px`,
                                transform: `translate(-50%, -50%) rotate(${textAngleDeg}deg)`,
                                fontFamily: textFont,
                                color: textColor,
                                width: `${
                                    (textWidthPercent / 100) * CANVAS_PX
                                }px`,
                                height: `${
                                    (textHeightPercent / 100) * CANVAS_PX
                                }px`,
                                zIndex: topLayer === "text" ? 2 : 1,
                            }}
                        >
                            <div
                                className="w-full h-full flex items-center justify-center text-center"
                                style={{
                                    fontSize: `${Math.max(
                                        8,
                                        Math.min(
                                            Math.floor(
                                                800 *
                                                    0.8 *
                                                    (textHeightPercent / 100)
                                            ),
                                            200
                                        )
                                    )}px`,
                                    lineHeight: 1.1,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "clip",
                                }}
                            >
                                {text}
                            </div>
                        </div>
                    )}

                    {uploadedImageUrl && (
                        <div
                            style={{
                                position: "absolute",
                                left: `${
                                    (imagePosition.x / 100) * CANVAS_PX -
                                    (designArea.x / 100) * CANVAS_PX
                                }px`,
                                top: `${
                                    (imagePosition.y / 100) * CANVAS_PX -
                                    (designArea.y / 100) * CANVAS_PX
                                }px`,
                                transform: `translate(-50%, -50%) rotate(${imageAngleDeg}deg)`,
                                width: `${
                                    (imageWidthPercent / 100) * CANVAS_PX
                                }px`,
                                height: `${
                                    (imageHeightPercent / 100) * CANVAS_PX
                                }px`,
                                zIndex: topLayer === "image" ? 2 : 1,
                            }}
                            className="select-none"
                        >
                            <Image
                                src={uploadedImageUrl}
                                alt="Overlay"
                                fill
                                className="object-contain"
                                sizes="96px"
                            />
                        </div>
                    )}
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
