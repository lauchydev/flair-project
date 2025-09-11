"use client";

import React, { forwardRef } from "react";
import Image from "next/image";
import CornerHandle from "../CornerHandle";
import RotateHandle from "../RotateHandle";

interface ImageOverlayProps {
    url: string;
    pos: { x: number; y: number }; // percent
    sizePct: { w: number; h: number }; // percent
    angleDeg: number;
    zIndex: number;
    cursor?: string;
    interactive?: boolean;
    designAreaMirrored?: boolean;
    onResize?: (
        handle: "nw" | "ne" | "sw" | "se",
        e: React.PointerEvent<HTMLDivElement>
    ) => void;
    onRotateStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const ImageOverlay = forwardRef<HTMLDivElement, ImageOverlayProps>(
    function ImageOverlay(
        {
            url,
            pos,
            sizePct,
            angleDeg,
            zIndex,
            cursor = "default",
            interactive = false,
            designAreaMirrored = false,
            onResize,
            onRotateStart,
        },
        ref
    ) {
        const style: React.CSSProperties = {
            position: "absolute",
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
            cursor,
            width: `${sizePct.w}%`,
            height: `${sizePct.h}%`,
            zIndex,
        };
        return (
            <div
                ref={ref}
                style={style}
                className={`rounded-md ${
                    interactive ? "shadow" : ""
                } select-none ${
                    interactive
                        ? "border-2 border-blue-500 border-dashed"
                        : "border-0"
                }`}
            >
                <Image
                    src={url}
                    alt="Overlay"
                    fill
                    className={`object-contain ${designAreaMirrored ? "" : ""}`}
                    sizes="96px"
                />
                {interactive && onResize && (
                    <>
                        <CornerHandle
                            position="nw"
                            positionClassName="left-0 top-0 -translate-x-1/2 -translate-y-1/2"
                            onDown={(e) => onResize("nw", e)}
                        />
                        <CornerHandle
                            position="ne"
                            positionClassName="right-0 top-0 translate-x-1/2 -translate-y-1/2"
                            onDown={(e) => onResize("ne", e)}
                        />
                        <CornerHandle
                            position="sw"
                            positionClassName="left-0 bottom-0 -translate-x-1/2 translate-y-1/2"
                            onDown={(e) => onResize("sw", e)}
                        />
                        <CornerHandle
                            position="se"
                            positionClassName="right-0 bottom-0 translate-x-1/2 translate-y-1/2"
                            onDown={(e) => onResize("se", e)}
                        />
                        {onRotateStart && (
                            <RotateHandle
                                angleDeg={angleDeg}
                                onStart={onRotateStart}
                            />
                        )}
                    </>
                )}
            </div>
        );
    }
);

export default ImageOverlay;
