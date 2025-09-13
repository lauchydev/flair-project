"use client";

import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import type { ViewPose } from "./types";
import TextOverlay from "./components/overlays/TextOverlay";
import ImageOverlay from "./components/overlays/ImageOverlay";
import DebugBadge from "./components/DebugBadge";
import {
    DesignAreaClip,
    DesignAreaOutline,
    ClippedText,
    ClippedImage,
} from "./components/DesignArea";
import { calculateFontSizePx } from "./components/utils/text";
import {
    snapToCanvas as snapXY,
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
    onTextDelete?: () => void;

    uploadedImageUrl: string | null;
    otherImages?: {
        url: string;
        x: number;
        y: number;
        widthPercent: number;
        heightPercent: number;
        angleDeg: number;
    }[];
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
    onTextDelete,
    uploadedImageUrl,
    otherImages = [],
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
    // const CANVAS_PX = 800; // centralized in DesignArea helpers
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
        | { kind: "move"; target: "text" | "image"; offset: PercentPos }
        | { kind: "resize"; start: ResizeStart }
        | {
              kind: "text-width-resize";
              start: { leftEdgeX: number; startCenterY: number };
          }
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
            const rect = (
                containerRef.current as HTMLDivElement
            ).getBoundingClientRect();
            const { x: px, y: py } = clientToPercent(
                e.clientX,
                e.clientY,
                rect
            );
            const base = target === "text" ? textPosition : imagePosition;
            activeDragRef.current = {
                kind: "move",
                target,
                offset: { x: px - base.x, y: py - base.y },
            };
            containerRef.current?.setPointerCapture?.(e.pointerId);
        };

    // Helper to snap to canvas bounds only (0-100)
    const snapToCanvas = (x: number, y: number): PercentPos => snapXY(x, y);

    // Small helpers to shrink onPointerMove
    const getEventPercent = (ev: React.PointerEvent<HTMLDivElement>) => {
        const rect = (
            containerRef.current || ev.currentTarget
        ).getBoundingClientRect();
        return clientToPercent(ev.clientX, ev.clientY, rect);
    };

    const snapIfDesignArea = (
        x: number,
        y: number,
        halfW: number,
        halfH: number
    ) => {
        if (!designArea) return { x, y };
        return softSnapCenterToRectWithCenter(x, y, halfW, halfH, designArea);
    };

    const handleMove = (
        target: "text" | "image",
        px: number,
        py: number,
        offset: { x: number; y: number }
    ) => {
        const base = snapToCanvas(px - offset.x, py - offset.y);
        if (target === "text") {
            const halfW = (textWidthPercent ?? 0) / 2;
            const halfH = (textHeightPercent ?? 0) / 2;
            const snapped = snapIfDesignArea(base.x, base.y, halfW, halfH);
            onTextPositionChange?.({ x: snapped.x, y: snapped.y });
        } else {
            const halfW = (imageWidthPercent ?? 0) / 2;
            const halfH = (imageHeightPercent ?? 0) / 2;
            const snapped = snapIfDesignArea(base.x, base.y, halfW, halfH);
            onImagePositionChange?.({ x: snapped.x, y: snapped.y });
        }
    };

    const handleResize = (px: number, py: number, s: ResizeStart) => {
        const sx = s.handle === "ne" || s.handle === "se" ? 1 : -1;
        const sy = s.handle === "sw" || s.handle === "se" ? 1 : -1;
        const anchorX = s.cx - (s.w / 2) * sx;
        const anchorY = s.cy - (s.h / 2) * sy;
        const widthFromX = Math.abs(px - anchorX);
        const heightFromY = Math.abs(py - anchorY);
        const snapPct = (v: number) => Math.max(5, Math.min(100, v));
        let newW = snapPct(widthFromX);
        let newH = snapPct(heightFromY);
        const applyAspect = (aspect: number | null) => {
            if (!aspect) return;
            const proposedW = snapPct(widthFromX);
            const proposedH = snapPct(heightFromY);
            if (Math.abs(widthFromX - s.w) >= Math.abs(heightFromY - s.h)) {
                newW = proposedW;
                newH = snapPct(newW / aspect);
            } else {
                newH = proposedH;
                newW = snapPct(newH * aspect);
            }
        };
        if (s.target === "image") applyAspect(imageAspectRef.current);
        if (s.target === "text") applyAspect(textAspectRef.current);
        const cx = anchorX + (newW / 2) * sx;
        const cy = anchorY + (newH / 2) * sy;
        if (s.target === "text") {
            onTextWidthPercentChange?.(newW);
            onTextHeightPercentChange?.(newH);
            onTextPositionChange?.(snapToCanvas(cx, cy));
        } else {
            onImageWidthPercentChange?.(newW);
            onImageHeightPercentChange?.(newH);
            onImagePositionChange?.(snapToCanvas(cx, cy));
        }
    };

    const handleTextWidthResize = (
        px: number,
        start: { leftEdgeX: number; startCenterY: number }
    ) => {
        const leftEdge = start.leftEdgeX;
        const canvasMaxW = Math.max(5, 100 - leftEdge);
        const areaRight = designArea ? designArea.x + designArea.width : 100;
        const areaMaxW = Math.max(5, areaRight - leftEdge);
        const maxW = Math.min(canvasMaxW, areaMaxW);
        let newW = px - leftEdge;
        newW = Math.max(5, Math.min(maxW, newW));
        const newCenterX = leftEdge + newW / 2;
        onTextWidthPercentChange?.(newW);
        onTextPositionChange?.(snapToCanvas(newCenterX, start.startCenterY));
    };

    const handleRotate = (
        ev: React.PointerEvent<HTMLDivElement>,
        data: {
            centerPx: { cx: number; cy: number };
            startAngleDeg: number;
            startPointerAngleDeg: number;
            target: "text" | "image";
        }
    ) => {
        const currentPointerAngleDeg =
            (Math.atan2(
                ev.clientY - data.centerPx.cy,
                ev.clientX - data.centerPx.cx
            ) *
                180) /
            Math.PI;
        let next =
            data.startAngleDeg +
            (currentPointerAngleDeg - data.startPointerAngleDeg);
        if (next > 180) next -= 360;
        if (next <= -180) next += 360;
        if (data.target === "text") onTextAngleDegChange?.(Math.round(next));
        else onImageAngleDegChange?.(Math.round(next));
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!draggable || !activeDragRef.current) return;
        const { x: px, y: py } = getEventPercent(e);
        const interaction = activeDragRef.current;
        switch (interaction.kind) {
            case "move":
                handleMove(interaction.target, px, py, interaction.offset);
                break;
            case "resize":
                handleResize(px, py, interaction.start);
                break;
            case "text-width-resize":
                handleTextWidthResize(px, interaction.start);
                break;
            case "rotate":
                handleRotate(e, interaction);
                break;
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

    // Short helper to begin rotation for text or image
    const rotateStart =
        (target: "text" | "image") =>
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!draggable) return;
            const node =
                target === "text"
                    ? (textRef.current as HTMLDivElement | null)
                    : (imageRef.current as HTMLDivElement | null);
            const box = node
                ? node.getBoundingClientRect()
                : e.currentTarget.getBoundingClientRect();
            const cx = box.left + box.width / 2;
            const cy = box.top + box.height / 2;
            const startPointerAngleDeg = pointerAngleDeg(
                cx,
                cy,
                e.clientX,
                e.clientY
            );
            const startAngle = target === "text" ? textAngleDeg : imageAngleDeg;
            activeDragRef.current = {
                kind: "rotate",
                target,
                centerPx: { cx, cy },
                startAngleDeg: startAngle,
                startPointerAngleDeg,
            };
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
            const isText = interaction.target === "text";
            const halfW =
                ((isText ? textWidthPercent : imageWidthPercent) ?? 0) / 2;
            const halfH =
                ((isText ? textHeightPercent : imageHeightPercent) ?? 0) / 2;
            const pos = isText ? textPosition : imagePosition;
            const outside = isOverlayFullyOutsideRect(
                pos.x,
                pos.y,
                halfW,
                halfH,
                designArea
            );
            if (outside) {
                if (isText) onTextPositionChange?.({ x: centerX, y: centerY });
                else onImagePositionChange?.({ x: centerX, y: centerY });
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
                <div onPointerDown={onPointerDown("text")}>
                    <TextOverlay
                        ref={textRef as React.Ref<HTMLDivElement>}
                        selected={selected === "text"}
                        hideContent={!!designArea}
                        text={text}
                        contentRef={textContentRef as React.Ref<HTMLDivElement>}
                        pos={{ x: textPosition.x, y: textPosition.y }}
                        sizePct={{ w: textWidthPercent, h: textHeightPercent }}
                        angleDeg={textAngleDeg}
                        zIndex={topLayer === "text" ? 20 : 10}
                        cursor={draggable ? "grab" : "default"}
                        fontFamily={textFont}
                        color={textColor}
                        fontPx={calculateFontSizePx(textHeightPercent)}
                        onResize={(h, e) => startResize("text", h, e)}
                        onRotateStart={
                            onTextAngleDegChange
                                ? rotateStart("text")
                                : undefined
                        }
                        onDelete={onTextDelete}
                        onWidthDragStart={(e) => {
                            if (!draggable) return;
                            e.preventDefault();
                            e.stopPropagation();
                            const leftEdgeX =
                                textPosition.x - textWidthPercent / 2;
                            activeDragRef.current = {
                                kind: "text-width-resize",
                                start: {
                                    leftEdgeX,
                                    startCenterY: textPosition.y,
                                },
                            };
                            containerRef.current?.setPointerCapture?.(
                                e.pointerId
                            );
                        }}
                    />
                </div>
            )}

            {/* Render additional images beneath active (non-interactive) */}
            {!designArea &&
                otherImages.map((img, key) => (
                    <ImageOverlay
                        key={`static-${key}`}
                        url={img.url}
                        pos={{ x: img.x, y: img.y }}
                        sizePct={{ w: img.widthPercent, h: img.heightPercent }}
                        angleDeg={img.angleDeg}
                        zIndex={5}
                    />
                ))}

            {uploadedImageUrl && (
                <div onPointerDown={onPointerDown("image")}>
                    <ImageOverlay
                        ref={imageRef as React.Ref<HTMLDivElement>}
                        url={uploadedImageUrl}
                        pos={{ x: imagePosition.x, y: imagePosition.y }}
                        sizePct={{
                            w: imageWidthPercent,
                            h: imageHeightPercent,
                        }}
                        angleDeg={imageAngleDeg}
                        zIndex={topLayer === "image" ? 20 : 10}
                        cursor={draggable ? "grab" : "default"}
                        interactive={
                            selected === "image" &&
                            !!onImageWidthPercentChange &&
                            !!onImageHeightPercentChange
                        }
                        hideContent={!!designArea}
                        onResize={(h, e) => startResize("image", h, e)}
                        onRotateStart={
                            onImageAngleDegChange
                                ? rotateStart("image")
                                : undefined
                        }
                    />
                </div>
            )}

            {designArea && (
                <DesignAreaClip area={designArea} zIndex={0}>
                    {text && (
                        <ClippedText
                            area={designArea}
                            text={text}
                            pos={{ x: textPosition.x, y: textPosition.y }}
                            widthPercent={textWidthPercent}
                            heightPercent={textHeightPercent}
                            angleDeg={textAngleDeg}
                            fontFamily={textFont}
                            color={textColor}
                            zIndex={topLayer === "text" ? 2 : 1}
                        />
                    )}
                    {otherImages.map((img, key) => (
                        <ClippedImage
                            key={`clip-static-${key}`}
                            area={designArea}
                            url={img.url}
                            pos={{ x: img.x, y: img.y }}
                            widthPercent={img.widthPercent}
                            heightPercent={img.heightPercent}
                            angleDeg={img.angleDeg}
                            zIndex={1}
                        />
                    ))}
                    {uploadedImageUrl && (
                        <ClippedImage
                            area={designArea}
                            url={uploadedImageUrl}
                            pos={{ x: imagePosition.x, y: imagePosition.y }}
                            widthPercent={imageWidthPercent}
                            heightPercent={imageHeightPercent}
                            angleDeg={imageAngleDeg}
                            zIndex={topLayer === "image" ? 2 : 1}
                        />
                    )}
                </DesignAreaClip>
            )}

            {showDesignArea && designArea && (
                <DesignAreaOutline area={designArea} />
            )}

            <DebugBadge text={view} />
        </div>
    );
}
