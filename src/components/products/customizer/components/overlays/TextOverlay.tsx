"use client";

import React, { forwardRef } from "react";
import CornerHandle from "../CornerHandle";
import RotateHandle from "../RotateHandle";

interface TextOverlayProps {
    selected: boolean;
    hideContent?: boolean;
    text: string;
    contentRef?: React.Ref<HTMLDivElement>;
    pos: { x: number; y: number }; // percent
    sizePct: { w: number; h: number }; // percent
    angleDeg: number;
    zIndex: number;
    cursor: string;
    fontFamily?: string;
    color?: string;
    fontPx: number;
    onResize: (
        handle: "nw" | "ne" | "sw" | "se",
        e: React.PointerEvent<HTMLDivElement>
    ) => void;
    onRotateStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
    onDelete?: () => void;
    onWidthDragStart?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const TextOverlay = forwardRef<HTMLDivElement, TextOverlayProps>(
    function TextOverlay(
        {
            selected,
            hideContent = false,
            text,
            contentRef,
            pos,
            sizePct,
            angleDeg,
            zIndex,
            cursor,
            fontFamily,
            color,
            fontPx,
            onResize,
            onRotateStart,
            onDelete,
            onWidthDragStart,
        },
        ref
    ) {
        const style: React.CSSProperties = {
            position: "absolute",
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
            cursor,
            fontFamily,
            color,
            userSelect: "none",
            width: `${sizePct.w}%`,
            height: "auto",
            zIndex,
            lineHeight: 1.1,
            fontSize: `${fontPx}px`,
        };
        const contentClass = `w-full text-center ${
            hideContent ? "invisible" : ""
        }`;
        const contentStyle: React.CSSProperties = {
            whiteSpace: "normal",
            wordBreak: "break-word",
            overflow: "visible",
        };

        return (
            <div ref={ref} style={style}>
                {selected ? (
                    <div className="relative w-full border-2 border-dashed border-blue-500 rounded-md shadow">
                        <div
                            ref={contentRef as React.Ref<HTMLDivElement>}
                            className={contentClass}
                            style={contentStyle}
                        >
                            {text}
                        </div>
                        {/* Right-edge width drag handle */}
                        {onWidthDragStart && (
                            <div
                                onPointerDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onWidthDragStart(e);
                                }}
                                className="absolute left-full top-0 ml-0 h-full w-3 rounded-md border-2 border-blue-500 bg-white/80 shadow-sm"
                                style={{ cursor: "ew-resize" }}
                                aria-label="Resize width"
                            />
                        )}
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
                            >
                                {onDelete && (
                                    <button
                                        type="button"
                                        onPointerDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete();
                                        }}
                                        className="h-8 w-8 rounded-xl border-2 border-red-500 bg-white text-red-600 shadow-sm flex items-center justify-center hover:bg-red-50"
                                        aria-label="Delete text"
                                        style={{ cursor: "pointer" }}
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="h-5 w-5"
                                            aria-hidden="true"
                                        >
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                            <path d="M10 11v6" />
                                            <path d="M14 11v6" />
                                        </svg>
                                    </button>
                                )}
                            </RotateHandle>
                        )}
                    </div>
                ) : (
                    <div
                        ref={contentRef as React.Ref<HTMLDivElement>}
                        className={contentClass}
                        style={contentStyle}
                    >
                        {text}
                    </div>
                )}
            </div>
        );
    }
);

export default TextOverlay;
