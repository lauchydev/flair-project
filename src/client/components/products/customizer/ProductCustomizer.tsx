"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { ShopifyProduct, ShopifyVariant } from "@/client/types/api/shopify";
import { getAvailableViewsForProduct } from "@/client/lib/customizer/config";

type ViewPose = "front" | "back" | "left" | "right";

interface ProductCustomizerProps {
  product: ShopifyProduct;
}

// Helper function to parse metafield boolean values
function parseMetafieldBoolean(value: string | null | undefined, defaultValue: boolean = true): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === "true";
}

// Helper function to parse color values from metafield
function parseColorMetafield(value: string | null | undefined): string[] {
  if (!value || !value.trim()) {
    return [];
  }

  const trimmed = value.trim();

  if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .filter((c: unknown) => typeof c === "string")
          .map((c: string) => c.trim())
          .filter(Boolean)
          .map((c: string) => {
            if (/^#?[0-9A-Fa-f]{3}$/.test(c) || /^#?[0-9A-Fa-f]{6}$/.test(c)) {
              return c.startsWith("#") ? c : `#${c}`;
            }
            return c;
          });
      }
    } catch {
    }
  }

  // Fallback string manipulation for hex codes
  const cleaned = trimmed.replace(/[\[\]"']/g, "");
  return cleaned
    .split(/[,;\s]+/)
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      if (/^#?[0-9A-Fa-f]{3}$/.test(c) || /^#?[0-9A-Fa-f]{6}$/.test(c)) {
        return c.startsWith("#") ? c : `#${c}`;
      }
      return c;
    });
}

// Helper function to parse price modifier from metafield
function parsePriceModifier(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

export default function ProductCustomizer({ product }: ProductCustomizerProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants.edges[0]?.node.id ?? null
  );
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [customText, setCustomText] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const variantEdges = product.variants.edges;

  // Get available views for this product
  const availableViews = useMemo(
    () => getAvailableViewsForProduct(product),
    [product]
  );
  const [selectedView, setSelectedView] = useState<ViewPose>(availableViews[0]);

  // Ensure selected view is valid when product changes
  useEffect(() => {
    if (!availableViews.includes(selectedView)) {
      setSelectedView(availableViews[0]);
    }
  }, [availableViews, selectedView]);

  // Feature flags from product metafields
  const enableCustomColor = parseMetafieldBoolean(product.customColor?.value);
  const enableCustomImage = parseMetafieldBoolean(product.customImage?.value);
  const enableCustomText = parseMetafieldBoolean(product.customText?.value);
  
  // Parse available colors from metafield
  const availableColours = useMemo(() => 
    parseColorMetafield(product.colorsList?.value),
    [product.colorsList?.value]
  );

  // Price for text
  const textPrice = useMemo(
    () => parsePriceModifier(product.customTextPrice?.value),
    [product.customTextPrice?.value]
  );

  // Price for image
  const imagePrice = useMemo(
    () => parsePriceModifier(product.customImagePrice?.value),
    [product.customImagePrice?.value]
  );

  // Price for product colour
  const colorPrice = useMemo(
    () => parsePriceModifier(product.customColorPrice?.value),
    [product.customColorPrice?.value]
  );
  
  // Set initial color if available
  useEffect(() => {
    if (availableColours.length > 0 && !selectedColor) {
      setSelectedColor(availableColours[0]);
    }
  }, [availableColours, selectedColor]);

  const selectedVariant: ShopifyVariant | null = useMemo(() => {
    return (
      product.variants.edges.find((e) => e.node.id === selectedVariantId)
        ?.node || null
    );
  }, [product.variants.edges, selectedVariantId]);

  // Dynamic Pricing with metafield support
  const priceDisplay = useMemo(() => {
    const base = selectedVariant?.price ?? product.priceRange.minVariantPrice;
    const baseAmount = parseFloat(base.amount);
    let extra = 0;

    // Flat text pricing from metafield
    if (enableCustomText && customText) {
      extra += textPrice;
    }

    // Flat image upload pricing (from variable)
    if (enableCustomImage && uploadedImage) {
      extra += imagePrice;
    }

    const total = Math.max(0, baseAmount + extra);
    return `$${total.toFixed(2)} ${base.currencyCode}`;
  }, [
    selectedVariant,
    product.priceRange.minVariantPrice,
    enableCustomText,
    customText,
    textPrice,
    enableCustomImage,
    uploadedImage,
    imagePrice,
  ]);

  // Variant selection logic
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

            {/* Color selection (metafield controlled) */}
            {enableCustomColor && availableColours.length > 0 && (
              <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
                <h2 className="mb-3 text-lg font-black text-black">Color
                  {/* If there's a price for selecting a color, display it */}
                {colorPrice > 0 && (
                    <span className="ml-2 align-baseline text-xs font-semibold text-gray-500">
                      +${colorPrice.toFixed(2)}
                    </span>
                  )}
                </h2>
                <div className="grid grid-cols-8 gap-2">
                  {availableColours.map((color) => (
                    <button
                      key={color}
                      aria-label={`Select color ${color}`}
                      onClick={() => setSelectedColor(color)}
                      className={`h-8 w-8 rounded-full border-2 border-black shadow transition-all ${
                        selectedColor === color ? "ring-4 ring-purple-400 scale-110" : "hover:scale-105"
                      }`}
                      // For time being, setting colour just changes colour of the background in the image preview
                      // TODO: Fix colour changing logic
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Upload image (metafield controlled) */}
            {enableCustomImage && (
              <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
                <h2 className="mb-3 text-lg font-black text-black">
                  Add image
                  {/* If there's a price for adding an image, display it */}
                  {imagePrice > 0 && (
                    <span className="ml-2 align-baseline text-xs font-semibold text-gray-500">
                      +${imagePrice.toFixed(2)}
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
                      setUploadedImage(url);
                    }}
                  />
                  {uploadedImage ? "Change image" : "Click to upload"}
                </label>
                {uploadedImage && (
                  <div className="mt-3 relative">
                    <div className="relative h-24 w-full overflow-hidden rounded-xl border-2 border-black">
                      <img src={uploadedImage} alt="Uploaded" className="h-full w-full object-cover" />
                    </div>
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                )}
              </section>
            )}

            {/* Add text (metafield controlled) */}
            {enableCustomText && (
              <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
                <h2 className="mb-3 text-lg font-black text-black">
                  Add text
                  {/* If there's a price for adding text, display it */}
                  {textPrice > 0 && (
                    <span className="ml-2 align-baseline text-xs font-semibold text-gray-500">
                      +${textPrice.toFixed(2)}
                    </span>
                  )}
                </h2>
                <input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Type your text"
                  className="w-full rounded-xl border-2 border-black px-3 py-2 font-semibold text-black placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </section>
            )}

            {/* Price + Actions bar */}
            <section>
              <div className="flex items-center gap-3 rounded-2xl border-4 border-black bg-white px-3 py-3 shadow-xl">
                {/* Quantity stepper */}
                <div className="flex items-center rounded-xl border-2 border-black group">
                  <button
                    aria-label="Decrease quantity"
                    className="px-3 py-2 font-black text-black hover:bg-gray-100 transition-colors"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <div className="min-w-10 text-center font-extrabold text-black">{quantity}</div>
                  <button
                    aria-label="Increase quantity"
                    className="px-3 py-2 font-black text-black hover:bg-gray-100 transition-colors"
                    onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                  >
                    +
                  </button>
                </div>

                {/* Add to cart button */}
                <button
                  className="flex-1 rounded-2xl border-4 border-black bg-purple-600 px-4 py-3 text-center font-black text-white shadow-xl hover:bg-purple-500 transition-colors"
                  onClick={() => {
                    // TODO: Implement Shopify cart with metafield attributes
                    console.log("Add to cart clicked", {
                      quantity,
                      selectedVariantId,
                      selectedColor,
                      selectedView, // DEBUGGING
                      uploadedImage,
                      customText,
                      // Preparation for cart (line attributes in shopify)
                      metafields: {
                        custom_text: customText,
                        custom_color: selectedColor,
                        custom_image: uploadedImage,
                        selected_view: selectedView, // DEBUGGING
                      }
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
              {/* TODO: Fix view changer, each view should display a different image of the product, 
              should carry over colour and changes on each view (images, text and placement) should be saved on each view */}
              <div className="mb-3 flex gap-2 justify-center">
                {availableViews.map((pose) => (
                  <button
                    key={pose}
                    onClick={() => setSelectedView(pose)}
                    className={`rounded-xl border-2 px-3 py-2 text-xs font-black uppercase tracking-wide cursor-pointer transition-colors ${
                      selectedView === pose
                        ? "bg-lime-400 text-black border-black"
                        : "bg-white text-black border-black hover:bg-gray-50"
                    }`}
                  >
                    {pose}
                  </button>
                ))}
              </div>

              {/* Canvas area */}
              <div className="relative h-[50vh] lg:h-[70vh] w-full overflow-hidden rounded-2xl border-2 border-black bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Base product image */}
                {/* TODO: Should change with the view switcher */}
                {product.featuredImage && (
                  <Image
                    src={product.featuredImage.url}
                    alt={product.featuredImage.altText || product.title}
                    fill
                    className="object-contain"
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                )}

                {/* Color overlay */}
                {/* TODO: Remove 'overlay' and add actual product color changes */}
                {selectedColor && (
                  <div
                    className="absolute inset-0 mix-blend-multiply opacity-60"
                    style={{ backgroundColor: selectedColor }}
                  />
                )}

                {/* Text overlay */}
                {/* TODO: Actually render the text ontop of the product, able to be saved and written to the product for when ordering through shopify */}
                {customText && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-xl border-2 border-black bg-white/70 px-3 py-1 text-sm font-black text-black shadow">
                    {customText}
                  </div>
                )}

                {/* Image overlay */}
                {/* TODO: Same as above for text */}
                {uploadedImage && (
                  <img
                    src={uploadedImage}
                    alt="Custom overlay"
                    className="absolute right-6 top-6 h-24 w-24 rounded-lg border-2 border-black object-cover shadow"
                  />
                )}

                {/* View indicator */}
                <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-white/70 px-2 py-1 text-xs font-black text-gray-700">
                  {selectedView}
                </div>
              </div>

              {/* Selection summary */}
              <div className="mt-4 text-sm font-extrabold text-gray-700">
                Selected: {selectedVariant?.title || "Default"} • View: {selectedView}
                {selectedColor && ` • Color: ${selectedColor}`}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

