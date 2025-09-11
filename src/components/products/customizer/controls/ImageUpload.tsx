"use client";

import Image from "next/image";
import { useRef } from "react";

interface ImageUploadProps {
    images: string[];
    activeIndex: number | null;
    onAdd: (urls: string[]) => void;
    onRemove: (index: number) => void;
    onMakeActive: (index: number) => void;
    onClearAll?: () => void;
    priceDelta?: number;
}

export default function ImageUpload({
    images,
    activeIndex,
    onAdd,
    onRemove,
    onMakeActive,
    onClearAll,
    priceDelta = 0,
}: ImageUploadProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);

    return (
        <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
                <h2 className="mb-3 text-lg font-black text-black">
                    Add images
                    {priceDelta > 0 && (
                        <span className="ml-2 align-baseline text-xs font-semibold text-gray-500">
                            +${priceDelta.toFixed(2)}
                        </span>
                    )}
                </h2>
                {images.length > 0 && (
                    <button
                        onClick={() => onClearAll?.()}
                        className="rounded-lg border-2 border-black px-2 py-1 text-xs font-bold hover:bg-gray-50"
                    >
                        Clear all
                    </button>
                )}
            </div>
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-black p-4 text-center font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                        const files = Array.from(e.target.files ?? []);
                        if (files.length === 0) return;
                        const urls = files.map((f) => URL.createObjectURL(f));
                        onAdd(urls);
                        // Allow selecting the same file again next time
                        if (inputRef.current) inputRef.current.value = "";
                    }}
                />
                {images.length > 0 ? "Add more images" : "Click to upload"}
            </label>

            {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                    {images.map((url, idx) => (
                        <div key={url} className="relative">
                            <button
                                onClick={() => onMakeActive(idx)}
                                className="block w-full"
                                title="Set as active"
                            >
                                <div
                                    className={`relative h-24 w-full rounded-xl border-2 ${
                                        activeIndex === idx
                                            ? "border-blue-600 ring-2 ring-blue-300"
                                            : "border-black"
                                    } overflow-hidden bg-white`}
                                >
                                    <Image
                                        src={url}
                                        alt={`Uploaded ${idx + 1}`}
                                        fill
                                        className="object-contain"
                                        sizes="120px"
                                    />
                                </div>
                            </button>
                            <button
                                onClick={() => onRemove(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                                title="Remove"
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
