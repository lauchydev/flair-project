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

    const onFilesChosen = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (!files.length) return;
        const urls = files.map((f) => URL.createObjectURL(f));
        onAdd(urls);
        if (inputRef.current) inputRef.current.value = "";
    };

    return (
        <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-black text-black">
                Add images
                {priceDelta > 0 && (
                    <span className="ml-2 align-baseline text-xs font-semibold text-gray-500">
                        +${priceDelta.toFixed(2)}
                    </span>
                )}
            </h2>

            <div className="flex items-center gap-3">
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-black px-4 py-2 text-center font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onFilesChosen}
                    />
                    Upload image(s)
                </label>

                {images.length > 0 && onClearAll && (
                    <button
                        type="button"
                        onClick={onClearAll}
                        className="rounded-xl border-2 border-black bg-white px-3 py-2 text-sm font-extrabold hover:bg-gray-50"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Thumbnails */}
            {images.length > 0 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                    {images.map((url, idx) => (
                        <div
                            key={`${url}-${idx}`}
                            className={`relative flex-shrink-0 overflow-hidden rounded-xl border-2 ${
                                idx === activeIndex
                                    ? "ring-2 ring-black"
                                    : "border-black"
                            }`}
                            style={{ width: 80, height: 80 }}
                        >
                            <button
                                type="button"
                                onClick={() => onMakeActive(idx)}
                                className="block w-full h-full"
                                title={`Make active ${idx + 1}`}
                            >
                                <Image
                                    src={url}
                                    alt={`Uploaded ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                />
                            </button>
                            <button
                                type="button"
                                onClick={() => onRemove(idx)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                                title="Remove image"
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
