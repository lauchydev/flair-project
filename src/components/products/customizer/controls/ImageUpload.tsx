"use client";

import Image from "next/image";
import { useRef } from "react";

interface ImageUploadProps {
    images: string[];
    activeIndex: number | null;
    onAdd: (urls: string[]) => void;
    onRemove: (index: number) => void;
    onMakeActive: (index: number) => void;
    priceDelta?: number;
}

export default function ImageUpload({
    images,
    activeIndex,
    onAdd,
    onRemove,
    onMakeActive,
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
                <label className="block w-full cursor-pointer rounded-xl border-2 border-dashed border-black px-4 py-2 text-center font-bold text-gray-700 hover:bg-gray-50 transition-colors">
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
            </div>

            {/* Thumbnails */}
            {images.length > 0 && (
                <div className="mt-4 flex gap-3 overflow-x-auto">
                    {images.map((url, idx) => (
                        <div
                            key={`${url}-${idx}`}
                            className={`relative flex-shrink-0 overflow-hidden rounded-2xl border-1 bg-white shadow-sm  ${
                                idx === activeIndex
                                    ? "border-3 border-blue-500"
                                    : "border-black"
                            }`}
                            style={{ width: 96, height: 96 }}
                        >
                            <button
                                type="button"
                                onClick={() => onMakeActive(idx)}
                                className="block w-full h-full"
                                title={`Make active ${idx + 1}`}
                                aria-pressed={idx === activeIndex}
                            >
                                <Image
                                    src={url}
                                    alt={`Uploaded ${idx + 1}`}
                                    fill
                                    draggable={false}
                                    className="object-cover select-none"
                                    sizes="96px"
                                />
                            </button>
                            <button
                                type="button"
                                onClick={() => onRemove(idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow hover:bg-red-600"
                                title="Remove image"
                                aria-label={`Remove image ${idx + 1}`}
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
