"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ShopifyProduct, ShopifyVariant } from "@/types/api/shopify";

type ViewPose = "front" | "back" | "left" | "right";

interface ProductCustomizerProps {
  product: ShopifyProduct;
}

export default function ProductCustomizer({ product }: ProductCustomizerProps) {
  
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants.edges[0]?.node.id ?? null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<ViewPose>("front");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const variantEdges = product.variants.edges;

  const selectedVariant: ShopifyVariant | null = useMemo(() => {
    return (
      product.variants.edges.find((e) => e.node.id === selectedVariantId)
        ?.node || null
    );
  }, [product.variants.edges, selectedVariantId]);

  // Dynamic Pricing
  const priceDisplay = useMemo(() => {
    const base = selectedVariant?.price ?? product.priceRange.minVariantPrice;
    // Add dynamic pricing options
    return `$${base.amount} ${base.currencyCode}`;
  }, [selectedVariant, product.priceRange.minVariantPrice]);

  const optionNames = useMemo(
    () =>
      Array.from(
        new Set(
          variantEdges.flatMap(v => v.node.selectedOptions.map(o => o.name))
        )
      ),
    [variantEdges]
  );
  const optionValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    optionNames.forEach(name => {
      map[name] = Array.from(
        new Set(
          variantEdges
            .map(v => v.node.selectedOptions.find(o => o.name === name)?.value)
            .filter(Boolean) as string[]
        )
      );
    });
    return map;
  }, [optionNames, variantEdges]);
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(
    () => {
      const first = variantEdges[0]?.node.selectedOptions ?? [];
      const init: Record<string, string> = {};
      first.forEach(o => (init[o.name] = o.value));
      return init;
    }
  );
  
  const selectedVariantFromOptions = useMemo(() => {
    const match = variantEdges.find(v =>
      optionNames.every(name =>
        v.node.selectedOptions.some(
          o => o.name === name && o.value === selectedOptions[name]
        )
      )
    );
    return match?.node ?? null;
  }, [optionNames, selectedOptions, variantEdges]);
  
  useEffect(() => {
    setSelectedVariantId(selectedVariantFromOptions?.id ?? null);
  }, [selectedVariantFromOptions?.id]);
  
  const isOptionAvailable = (name: string, value: string) =>
    variantEdges.some(v =>
      v.node.availableForSale &&
      v.node.selectedOptions.every(o =>
        o.name === name ? o.value === value : selectedOptions[o.name] ? o.value === selectedOptions[o.name] : true
      )
    );
  

  return (
    <div className="bg-gradient-to-b from-yellow-50 to-purple-50 py-10">
      <div className="container mx-auto px-4">
        {/* Header strip */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-black">{product.title}</h1>
            <p className="text-sm text-gray-700 font-semibold">
              Configure your design and add to cart
            </p>
          </div>
        </div>

        {/* Layout: Controls left, Preview right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Panel */}
          <aside className="lg:col-span-4 space-y-6">
            {/* Variant select (size, etc.) */}

            {optionNames.length > 0 || !optionNames.every(name => name === "Default Title") && (
            <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
                <h2 className="mb-3 text-lg font-black text-black">Options</h2>

                {optionNames.map((name) => (
                <div key={name} className="mb-3">
                    <div className="mb-2 text-xs font-extrabold text-gray-700 uppercase tracking-wide">{name}</div>
                    <div className="flex flex-wrap gap-2">
                    {optionValues[name].map((value) => {
                        const active = selectedOptions[name] === value;
                        const available = isOptionAvailable(name, value);
                        return (
                        <button
                            key={value}
                            disabled={!available}
                            onClick={() =>
                            setSelectedOptions((prev) => ({ ...prev, [name]: value }))
                            }
                            className={`rounded-xl border-2 px-3 py-2 text-sm font-extrabold ${
                            active
                                ? "bg-purple-500 text-white border-black"
                                : "bg-white text-black border-black hover:bg-gray-50"
                            } ${!available ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            {value}
                        </button>
                        );
                    })}
                    </div>
                </div>
                ))}
            </section>
            )}

            {/* Colour switch */}
            <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
              <h2 className="mb-3 text-lg font-black text-black">Color</h2>
              <div className="grid grid-cols-8 gap-2">
                {["#111827", "#9CA3AF", "#EF4444", "#0EA5E9", "#22C55E", "#F59E0B", "#F472B6", "#14B8A6"].map(
                  (hex) => (
                    <button
                      key={hex}
                      aria-label={`Select color ${hex}`}
                      onClick={() => setSelectedColor(hex)}
                      className={`h-8 w-8 rounded-full border-2 border-black shadow ${
                        selectedColor === hex ? "ring-4 ring-purple-400" : ""
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  )
                )}
              </div>
            </section>

            {/* Upload image */}
            <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
              <h2 className="mb-3 text-lg font-black text-black">Add image</h2>
              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-black p-4 text-center font-bold text-gray-700 hover:bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = URL.createObjectURL(file);
                    setUploadedImage(url);
                  }}
                />
                Click to upload
              </label>
              {uploadedImage && (
                <div className="mt-3 relative h-24 w-full overflow-hidden rounded-xl border-2 border-black">
                  <img src={uploadedImage} alt="Uploaded" className="h-full w-full object-cover" />
                </div>
              )}
            </section>

            {/* Add text */}
            <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
              <h2 className="mb-3 text-lg font-black text-black">Add text</h2>
              <input
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type your text"
                className="w-full rounded-xl border-2 border-black px-3 py-2 font-semibold placeholder-gray-400 focus:outline-none"
              />
            </section>

            {/* Price + Actions bar */}
            <section>
              <div className="flex items-center gap-3 rounded-2xl border-4 border-black bg-white px-3 py-3 shadow-xl">
                {/* Quantity stepper */}
                <div className="flex items-center rounded-xl border-2 border-black group">
                  <button
                    aria-label="Decrease quantity"
                    className="px-3 py-2 font-black text-black hover:bg-gray-100"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <div className="min-w-10 text-center font-extrabold text-black">{quantity}</div>
                  <button
                    aria-label="Increase quantity"
                    className="px-3 py-2 font-black text-black hover:bg-gray-100"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  >
                    +
                  </button>
                </div>

                {/* Add to cart button */}
                <button
                  className="flex-1 rounded-2xl border-4 border-black bg-purple-600 px-4 py-3 text-center font-black text-white shadow-xl hover:bg-purple-500"
                  onClick={() => {
                    // TODO: Shopify cart
                    console.log("Add to cart clicked", {
                      quantity,
                      selectedVariantId,
                      selectedColor,
                      selectedView,
                      uploadedImage,
                      customText,
                    });
                  }}
                >
                  Add to cart
                </button>

                {/* Price display (right aligned) */}
                <div className="ml-auto w-max rounded-xl border-2 border-black bg-white px-4 py-2 text-right">
                  <div className="text-xl font-black text-black">{priceDisplay}</div>
                </div>
              </div>
              <div className="mt-2 text-xs font-semibold text-gray-600">
                Prices are estimates. Final price updates as you customize.
              </div>
            </section>
          </aside>






          {/* Preview Panel */}
          <section className="lg:col-span-8">
            <div className="rounded-3xl border-4 border-black bg-white p-4 shadow-xl">
              {/* View switcher */}
              <div className="mb-3 flex gap-2 justify-center">
                {(["front", "back", "left", "right"] as ViewPose[]).map(
                  (pose) => (
                    <button
                      key={pose}
                      onClick={() => setSelectedView(pose)}
                      className={`rounded-xl border-2 px-3 py-2 text-xs font-black uppercase tracking-wide cursor-pointer ${
                        selectedView === pose
                          ? "bg-lime-400 text-black border-black"
                          : "bg-white text-black border-black hover:bg-gray-50"
                      }`}
                    >
                      {pose}
                    </button>
                  )
                )}
              </div>

              {/* Canvas area */}
              <div className="relative h-[50vh] lg:h-[70vh] w-full overflow-hidden rounded-2xl border-2 border-black bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Base product image (simple placeholder: featured image) */}
                {product.featuredImage && (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                )}

                {/* Color overlay demo */}
                {selectedColor && (
                  <div
                    className="absolute inset-0 mix-blend-multiply opacity-60"
                    style={{ backgroundColor: selectedColor }}
                  />
                )}

                {/* Text overlay demo */}
                {customText && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl border-2 border-black bg-white/70 px-3 py-1 text-sm font-black text-black shadow">
                    {customText}
                  </div>
                )}

                {/* Image overlay demo */}
                {uploadedImage && (
                  <img
                    src={uploadedImage}
                    alt="Overlay"
                    className="absolute right-6 top-6 h-24 w-24 rounded-lg border-2 border-black object-cover shadow"
                  />
                )}
              </div>

              {/* Selection summary */}
              <div className="mt-4 text-sm font-extrabold text-gray-700">
                Selected: {selectedVariant?.title || "Default"} • View: {selectedView}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

