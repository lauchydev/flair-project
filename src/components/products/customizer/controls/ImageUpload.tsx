"use client";

import Image from "next/image";

interface ImageUploadProps {
    uploadedImageUrl: string | null;
    onSelect: (url: string) => void;
    onClear: () => void;
    priceDelta?: number;
}

export default function ImageUpload({
    uploadedImageUrl,
    onSelect,
    onClear,
    priceDelta = 0,
}: ImageUploadProps) {
    return (
        <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-black text-black">
                Add image
                {priceDelta > 0 && (
                    <span className="ml-2 align-baseline text-xs font-semibold text-gray-500">
                        +${priceDelta.toFixed(2)}
                    </span>
                )}
            </h2>
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-black p-4 text-center font-bold text-gray-700 hover:bg-gray-50 transition-colors">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        onSelect(url);
                    }}
                />
                {uploadedImageUrl ? "Change image" : "Click to upload"}
            </label>
            {uploadedImageUrl && (
                <div className="mt-3 relative">
                    <div className="relative h-24 w-full overflow-hidden rounded-xl border-2 border-black">
                        <Image
                            src={uploadedImageUrl}
                            alt="Uploaded"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 66vw"
                        />
                    </div>
                    <button
                        onClick={onClear}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                    >
                        ×
                    </button>
                </div>
            )}
        </section>
    );
}
