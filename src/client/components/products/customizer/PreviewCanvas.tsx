"use client";

import Image from "next/image";
import type { ShopifyProduct } from "@/client/types/api/shopify";
import type { ViewPose } from "./types";

interface PreviewCanvasProps {
  product: ShopifyProduct;
  view: ViewPose;
  colorHex: string | null;
  text: string;
  uploadedImageUrl: string | null;
}

export default function PreviewCanvas({
  product,
  view,
  colorHex,
  text,
  uploadedImageUrl,
}: PreviewCanvasProps) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border-2 border-black bg-gradient-to-br from-gray-50 to-gray-100">
      {product.featuredImage && (
        <Image
          src={product.featuredImage.url}
          alt={product.featuredImage.altText || product.title}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 66vw"
        />
      )}

      {colorHex && (
        <div className="absolute inset-0 mix-blend-multiply opacity-60" style={{ backgroundColor: colorHex }} />
      )}

      {text && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl border-2 border-black bg-white/70 px-3 py-1 text-sm font-black text-black shadow">
          {text}
        </div>
      )}

      {uploadedImageUrl && (
        <img
          src={uploadedImageUrl}
          alt="Overlay"
          className="absolute right-6 top-6 h-24 w-24 rounded-lg border-2 border-black object-cover shadow"
        />
      )}

      <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/70 px-2 py-1 text-xs font-black text-gray-700">
        {view}
      </div>
    </div>
  );
}

