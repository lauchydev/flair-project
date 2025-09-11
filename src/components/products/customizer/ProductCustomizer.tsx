"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import type { ShopifyProduct } from "@/types/api/shopify";
import { getAvailableViewsForProduct } from "@/lib/customizer/config";
import { getColorImageMap } from "@/lib/customizer/assets";
import {
    parseMetafieldBoolean,
    parseColorMetafield,
    parsePriceModifier,
    parseDesignAreaMetafield,
} from "@/lib/customizer/metafields";
import type { ViewPose } from "./types";
import VariantOptions from "./controls/VariantOptions";
import ColorPicker from "./controls/ColorPicker";
import TextInput from "./controls/TextInput";
import ImageUpload from "./controls/ImageUpload";
import ViewSwitcher from "./controls/ViewSwitcher";
import PreviewCanvas from "./PreviewCanvas";
import { useVariantOptions } from "./hooks/useVariantOptions";
import { usePriceDisplay } from "./hooks/usePriceDisplay";
import TextStyle from "./controls/TextStyle";
import PriceActionsBar from "./components/PriceActionsBar";

interface ProductCustomizerProps {
    product: ShopifyProduct;
}

export default function ProductCustomizer({ product }: ProductCustomizerProps) {
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [selectedView, setSelectedView] = useState<ViewPose>("front");

    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
        product.variants.edges[0]?.node.id ?? null
    );

    // Design area (metafield-backed) and per-view centers
    const designAreaConfig = useMemo(() => {
        type Rect = { x: number; y: number; width: number; height: number };
        const isRect = (o: unknown): o is Rect => {
            if (!o || typeof o !== "object") return false;
            const r = o as Record<string, unknown>;
            return (
                typeof r.x === "number" &&
                typeof r.y === "number" &&
                typeof r.width === "number" &&
                typeof r.height === "number"
            );
        };
        /* Retrieve the design area from the product metafield in shopfify */
        const parsed = parseDesignAreaMetafield(product.designArea?.value);
        console.log("DESIGN AREA:", parsed);
        /* Default Design Area when no area is defined */
        const fallback: Rect = { x: 224, y: 184, width: 352, height: 432 }; // approx 28%,23%,44%,54% on 800px
        if (!parsed) {
            return { front: fallback, back: fallback } as Record<
                ViewPose,
                Rect
            >;
        }
        if (isRect(parsed)) {
            const rect = parsed as Rect;
            return { front: rect, back: rect } as Record<ViewPose, Rect>;
        }
        const byViewUnknown = parsed as Record<string, unknown>;
        const pick = (k: string): Rect | undefined =>
            isRect(byViewUnknown[k]) ? (byViewUnknown[k] as Rect) : undefined;
        return {
            front:
                pick("front") ||
                pick("Front") ||
                pick("FRONT") ||
                pick("default") ||
                fallback,
            back:
                pick("back") ||
                pick("Back") ||
                pick("BACK") ||
                pick("default") ||
                pick("front") ||
                fallback,
        } as Record<ViewPose, Rect>;
    }, [product.designArea?.value]);

    // Convert pixel rects (800x800) to percent rects for rendering
    const designAreaPercent = useMemo(() => {
        const toPct = (v: number) => (v / 800) * 100;
        const pxToPct = (r: {
            x: number;
            y: number;
            width: number;
            height: number;
        }) => ({
            x: toPct(r.x),
            y: toPct(r.y),
            width: toPct(r.width),
            height: toPct(r.height),
        });
        return {
            front: pxToPct(designAreaConfig.front),
            back: pxToPct(designAreaConfig.back),
        } as Record<
            ViewPose,
            { x: number; y: number; width: number; height: number }
        >;
    }, [designAreaConfig.front, designAreaConfig.back]);

    const areaCenters = useMemo(() => {
        return {
            front: {
                x:
                    designAreaPercent.front.x +
                    designAreaPercent.front.width / 2,
                y:
                    designAreaPercent.front.y +
                    designAreaPercent.front.height / 2,
            },
            back: {
                x: designAreaPercent.back.x + designAreaPercent.back.width / 2,
                y: designAreaPercent.back.y + designAreaPercent.back.height / 2,
            },
        } as Record<ViewPose, { x: number; y: number }>;
    }, [
        designAreaPercent.front.x,
        designAreaPercent.front.y,
        designAreaPercent.front.width,
        designAreaPercent.front.height,
        designAreaPercent.back.x,
        designAreaPercent.back.y,
        designAreaPercent.back.width,
        designAreaPercent.back.height,
    ]);

    const currentCenter = useMemo(
        () => areaCenters[selectedView],
        [areaCenters, selectedView]
    );

    // Extend viewCustomizations initial state
    const [viewCustomizations, setViewCustomizations] = useState({
        front: {
            text: "",
            uploadedImage: null,
            uploadedImages: [] as string[],
            activeImageIndex: null as number | null,
            imageOverlays: [] as {
                url: string;
                x: number;
                y: number;
                widthPercent: number;
                heightPercent: number;
                angleDeg: number;
            }[],
            textPos: { x: areaCenters.front.x, y: areaCenters.front.y },
            imagePos: { x: areaCenters.front.x, y: areaCenters.front.y },
            textColor: "#000000",
            textFont:
                "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
            textWidthPercent: 40,
            textHeightPercent: 12,
            textAngleDeg: 0,
            imageWidthPercent: 20,
            imageHeightPercent: 20,
            imageAngleDeg: 0,
        },
        back: {
            text: "",
            uploadedImage: null,
            uploadedImages: [] as string[],
            activeImageIndex: null as number | null,
            imageOverlays: [] as {
                url: string;
                x: number;
                y: number;
                widthPercent: number;
                heightPercent: number;
                angleDeg: number;
            }[],
            textPos: { x: areaCenters.back.x, y: areaCenters.back.y },
            imagePos: { x: areaCenters.back.x, y: areaCenters.back.y },
            textColor: "#000000",
            textFont:
                "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
            textWidthPercent: 40,
            textHeightPercent: 12,
            textAngleDeg: 0,
            imageWidthPercent: 20,
            imageHeightPercent: 20,
            imageAngleDeg: 0,
        },
    });

    const availableViews: ViewPose[] = useMemo(
        () => getAvailableViewsForProduct(product),
        [product]
    );

    // Ensure selected view is valid for the current product
    useEffect(() => {
        if (!availableViews.includes(selectedView)) {
            setSelectedView(availableViews[0] ?? "front");
        }
    }, [availableViews, selectedView]);

    // Shorthands
    const { textPos, imagePos } = viewCustomizations[selectedView];

    const currentViewCustomization = viewCustomizations[selectedView];
    const activeImageUrl = (() => {
        const overlays = currentViewCustomization.imageOverlays ?? [];
        const idx = currentViewCustomization.activeImageIndex ?? null;
        if (idx !== null && overlays[idx]) return overlays[idx].url;
        const imgsFallback = currentViewCustomization.uploadedImages ?? [];
        if (idx !== null && imgsFallback[idx]) return imgsFallback[idx];
        return currentViewCustomization.uploadedImage;
    })();

    const otherImages = useMemo(() => {
        const overlays = currentViewCustomization.imageOverlays ?? [];
        const idx = currentViewCustomization.activeImageIndex ?? null;
        return overlays
            .map((o, i) => ({ ...o, index: i }))
            .filter((o) => o.index !== idx)
            .map((o) => ({
                url: o.url,
                x: o.x,
                y: o.y,
                widthPercent: o.widthPercent,
                heightPercent: o.heightPercent,
                angleDeg: o.angleDeg,
            }));
    }, [
        currentViewCustomization.imageOverlays,
        currentViewCustomization.activeImageIndex,
    ]);
    // Concise helpers to update current view
    const updateView = (patch: Partial<typeof currentViewCustomization>) =>
        setViewCustomizations((prev) => ({
            ...prev,
            [selectedView]: { ...prev[selectedView], ...patch },
        }));

    // Image overlay updaters for the active image
    const setImagePosition = (pos: { x: number; y: number }) =>
        setViewCustomizations((prev) => {
            const view = prev[selectedView];
            const idx = view.activeImageIndex;
            let overlays = view.imageOverlays ?? [];
            if (idx !== null && overlays[idx]) {
                overlays = overlays.map((o, i) =>
                    i === idx ? { ...o, x: pos.x, y: pos.y } : o
                );
            }
            return {
                ...prev,
                [selectedView]: {
                    ...view,
                    imagePos: pos,
                    imageOverlays: overlays,
                },
            };
        });
    const setImageWidth = (w: number) =>
        setViewCustomizations((prev) => {
            const view = prev[selectedView];
            const idx = view.activeImageIndex;
            let overlays = view.imageOverlays ?? [];
            if (idx !== null && overlays[idx])
                overlays = overlays.map((o, i) =>
                    i === idx ? { ...o, widthPercent: w } : o
                );
            return {
                ...prev,
                [selectedView]: {
                    ...view,
                    imageWidthPercent: w,
                    imageOverlays: overlays,
                },
            };
        });
    const setImageHeight = (h: number) =>
        setViewCustomizations((prev) => {
            const view = prev[selectedView];
            const idx = view.activeImageIndex;
            let overlays = view.imageOverlays ?? [];
            if (idx !== null && overlays[idx])
                overlays = overlays.map((o, i) =>
                    i === idx ? { ...o, heightPercent: h } : o
                );
            return {
                ...prev,
                [selectedView]: {
                    ...view,
                    imageHeightPercent: h,
                    imageOverlays: overlays,
                },
            };
        });
    const setImageAngle = (a: number) =>
        setViewCustomizations((prev) => {
            const view = prev[selectedView];
            const idx = view.activeImageIndex;
            let overlays = view.imageOverlays ?? [];
            if (idx !== null && overlays[idx])
                overlays = overlays.map((o, i) =>
                    i === idx ? { ...o, angleDeg: a } : o
                );
            return {
                ...prev,
                [selectedView]: {
                    ...view,
                    imageAngleDeg: a,
                    imageOverlays: overlays,
                },
            };
        });
    const customText = currentViewCustomization.text;
    const textColor = currentViewCustomization.textColor as string;
    const textFont = currentViewCustomization.textFont as string;
    const textWidthPercent =
        currentViewCustomization.textWidthPercent as number;
    const textHeightPercent =
        currentViewCustomization.textHeightPercent as number;
    const textAngleDeg = currentViewCustomization.textAngleDeg as number;
    const imageWidthPercent =
        currentViewCustomization.imageWidthPercent as number;
    const imageHeightPercent =
        currentViewCustomization.imageHeightPercent as number;
    const imageAngleDeg = currentViewCustomization.imageAngleDeg as number;

    // Feature flags from product metafields
    const enableCustomColor = parseMetafieldBoolean(product.customColor?.value);
    const enableCustomImage = parseMetafieldBoolean(product.customImage?.value);
    const enableCustomText = parseMetafieldBoolean(product.customText?.value);

    // Parse available colors from metafield
    const availableColours = useMemo(
        () => parseColorMetafield(product.colorsList?.value),
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
        if (availableColours.length === 0) {
            if (selectedColor !== null) setSelectedColor(null);
            return;
        }
        if (!selectedColor || !availableColours.includes(selectedColor)) {
            setSelectedColor(availableColours[0]);
        }
    }, [availableColours, selectedColor]);

    const {
        optionNames,
        optionValues,
        selectedOptions,
        setSelectedOptions,
        selectedVariant,
        isOptionAvailable,
    } = useVariantOptions(product);
    useEffect(() => {
        setSelectedVariantId(selectedVariant?.id ?? null);
    }, [selectedVariant?.id, setSelectedVariantId]);

    // Dynamic Pricing with metafield support
    const priceDisplay = usePriceDisplay(product, selectedVariant, {
        addText: enableCustomText && !!customText,
        textPrice,
        addImage: enableCustomImage && !!activeImageUrl,
        imagePrice,
    });

    // Auto-center on add (when transitioning from empty to present)
    const prevTextPresentRef = useRef<{ front: boolean; back: boolean }>({
        front: false,
        back: false,
    });
    useEffect(() => {
        const vc = viewCustomizations[selectedView];
        const hasText = !!vc.text;
        const hadText = prevTextPresentRef.current[selectedView];
        if (!hadText && hasText) {
            setViewCustomizations((prev) => ({
                ...prev,
                [selectedView]: {
                    ...prev[selectedView],
                    textPos: { x: currentCenter.x, y: currentCenter.y },
                },
            }));
        }
        prevTextPresentRef.current[selectedView] = hasText;
    }, [selectedView, viewCustomizations, currentCenter.x, currentCenter.y]);

    const prevImagePresentRef = useRef<{ front: boolean; back: boolean }>({
        front: false,
        back: false,
    });
    useEffect(() => {
        const vc = viewCustomizations[selectedView];
        const hasImg = !!vc.uploadedImage;
        const hadImg = prevImagePresentRef.current[selectedView];
        if (!hadImg && hasImg) {
            setViewCustomizations((prev) => ({
                ...prev,
                [selectedView]: {
                    ...prev[selectedView],
                    imagePos: { x: currentCenter.x, y: currentCenter.y },
                },
            }));
        }
        prevImagePresentRef.current[selectedView] = hasImg;
    }, [selectedView, viewCustomizations, currentCenter.x, currentCenter.y]);

    return (
        <div className="bg-gradient-to-b from-yellow-50 to-purple-50 py-10">
            <div className="container mx-auto px-4">
                {/* Header strip */}
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-black">
                            {product.title}
                        </h1>
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
                        <VariantOptions
                            optionNames={optionNames}
                            optionValues={optionValues}
                            selectedOptions={selectedOptions}
                            isOptionAvailable={isOptionAvailable}
                            onChange={(name, value) =>
                                setSelectedOptions((prev) => ({
                                    ...prev,
                                    [name]: value,
                                }))
                            }
                        />

                        {/* Color selection (metafield controlled) */}
                        {enableCustomColor && (
                            <ColorPicker
                                colors={availableColours}
                                selectedColor={selectedColor}
                                onSelect={(c) => setSelectedColor(c)}
                                priceDelta={colorPrice}
                            />
                        )}

                        {/* Upload image (metafield controlled) */}
                        {enableCustomImage && (
                            <ImageUpload
                                images={currentViewCustomization.uploadedImages}
                                activeIndex={
                                    currentViewCustomization.activeImageIndex
                                }
                                onAdd={(urls: string[]) =>
                                    setViewCustomizations((prev) => {
                                        const view = prev[selectedView];
                                        const existing =
                                            view.uploadedImages ?? [];
                                        const combined = [...existing, ...urls];
                                        const newOverlays = [
                                            ...(view.imageOverlays ?? []),
                                            ...urls.map((u: string) => ({
                                                url: u,
                                                x: currentCenter.x,
                                                y: currentCenter.y,
                                                widthPercent:
                                                    view.imageWidthPercent,
                                                heightPercent:
                                                    view.imageHeightPercent,
                                                angleDeg: view.imageAngleDeg,
                                            })),
                                        ];
                                        const nextActive =
                                            view.activeImageIndex !== null
                                                ? view.activeImageIndex
                                                : 0;
                                        return {
                                            ...prev,
                                            [selectedView]: {
                                                ...view,
                                                uploadedImages: combined,
                                                imageOverlays: newOverlays,
                                                activeImageIndex: nextActive,
                                                uploadedImage:
                                                    combined[nextActive] ??
                                                    null,
                                            },
                                        };
                                    })
                                }
                                onRemove={(index: number) =>
                                    setViewCustomizations((prev) => {
                                        const view = prev[selectedView];
                                        const imgs = [
                                            ...(view.uploadedImages ?? []),
                                        ];
                                        imgs.splice(index, 1);
                                        const overlays = [
                                            ...(view.imageOverlays ?? []),
                                        ];
                                        overlays.splice(index, 1);
                                        let nextActive: number | null =
                                            view.activeImageIndex;
                                        if (nextActive === index) {
                                            nextActive = imgs.length ? 0 : null;
                                        } else if (
                                            nextActive !== null &&
                                            index < nextActive
                                        ) {
                                            nextActive = nextActive - 1;
                                        }
                                        return {
                                            ...prev,
                                            [selectedView]: {
                                                ...view,
                                                uploadedImages: imgs,
                                                imageOverlays: overlays,
                                                activeImageIndex: nextActive,
                                                uploadedImage:
                                                    nextActive !== null &&
                                                    imgs[nextActive]
                                                        ? imgs[nextActive]
                                                        : null,
                                            },
                                        };
                                    })
                                }
                                onMakeActive={(index: number) =>
                                    setViewCustomizations((prev) => {
                                        const view = prev[selectedView];
                                        const imgs = view.uploadedImages ?? [];
                                        const overlay = (view.imageOverlays ??
                                            [])[index];
                                        return {
                                            ...prev,
                                            [selectedView]: {
                                                ...view,
                                                activeImageIndex: index,
                                                uploadedImage:
                                                    imgs[index] ?? null,
                                                // Sync top-level transforms to overlay for editing
                                                imagePos: overlay
                                                    ? {
                                                          x: overlay.x,
                                                          y: overlay.y,
                                                      }
                                                    : view.imagePos,
                                                imageWidthPercent:
                                                    overlay?.widthPercent ??
                                                    view.imageWidthPercent,
                                                imageHeightPercent:
                                                    overlay?.heightPercent ??
                                                    view.imageHeightPercent,
                                                imageAngleDeg:
                                                    overlay?.angleDeg ??
                                                    view.imageAngleDeg,
                                            },
                                        };
                                    })
                                }
                                priceDelta={imagePrice}
                            />
                        )}

                        {/* Add text (metafield controlled) */}
                        {enableCustomText && (
                            <TextInput
                                value={customText}
                                onChange={(val) => updateView({ text: val })}
                                priceDelta={textPrice}
                            />
                        )}

                        {/* Text style (font + color) */}
                        {enableCustomText && (
                            <TextStyle
                                fontFamily={textFont}
                                colorHex={textColor}
                                onFontChange={(font) =>
                                    updateView({ textFont: font })
                                }
                                onColorChange={(hex) =>
                                    updateView({ textColor: hex })
                                }
                            />
                        )}

                        {/* Price + Actions bar */}
                        <PriceActionsBar
                            quantity={quantity}
                            onQuantityChange={setQuantity}
                            onAddToCart={() => {
                                console.log("Add to cart clicked", {
                                    quantity,
                                    selectedVariantId,
                                    selectedColor,
                                    selectedView,
                                    activeImageUrl,
                                    customText,
                                    metafields: {
                                        custom_text_front:
                                            viewCustomizations.front.text,
                                        custom_text_back:
                                            viewCustomizations.back.text,
                                        custom_color: selectedColor,
                                        custom_image_front:
                                            viewCustomizations.front
                                                .uploadedImage,
                                        custom_image_back:
                                            viewCustomizations.back
                                                .uploadedImage,
                                        selected_view: selectedView,
                                    },
                                });
                            }}
                            priceDisplay={priceDisplay}
                        />
                    </aside>

                    {/* Preview Panel */}
                    <section className="lg:col-span-8">
                        <div className="mx-auto w-fit rounded-3xl border-4 border-black bg-white p-4 shadow-xl">
                            {/* View switcher */}
                            <ViewSwitcher
                                views={availableViews}
                                selected={selectedView}
                                onSelect={(v) => setSelectedView(v)}
                            />

                            {/* Canvas area */}
                            {(() => {
                                const img = getColorImageMap(
                                    product,
                                    availableColours,
                                    selectedColor,
                                    selectedView
                                );

                                const textProps = {
                                    text: customText,
                                    textPosition: textPos,
                                    onTextPositionChange: (pos: {
                                        x: number;
                                        y: number;
                                    }) => updateView({ textPos: pos }),
                                    textColor,
                                    textFont,
                                    textWidthPercent,
                                    onTextWidthPercentChange: (w: number) =>
                                        updateView({ textWidthPercent: w }),
                                    textHeightPercent,
                                    onTextHeightPercentChange: (h: number) =>
                                        updateView({ textHeightPercent: h }),
                                    textAngleDeg,
                                    onTextAngleDegChange: (a: number) =>
                                        updateView({ textAngleDeg: a }),
                                    onTextDelete: () => {
                                        setViewCustomizations((prev) => ({
                                            ...prev,
                                            [selectedView]: {
                                                ...prev[selectedView],
                                                text: "",
                                                textPos: {
                                                    x: currentCenter.x,
                                                    y: currentCenter.y,
                                                },
                                                textWidthPercent: 40,
                                                textHeightPercent: 12,
                                                textAngleDeg: 0,
                                                textColor: "#000000",
                                                textFont:
                                                    "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
                                            },
                                        }));
                                    },
                                };

                                const imageProps = {
                                    uploadedImageUrl: activeImageUrl,
                                    otherImages,
                                    imagePosition: imagePos,
                                    onImagePositionChange: setImagePosition,
                                    imageWidthPercent,
                                    imageHeightPercent,
                                    imageAngleDeg,
                                    onImageWidthPercentChange: setImageWidth,
                                    onImageHeightPercentChange: setImageHeight,
                                    onImageAngleDegChange: setImageAngle,
                                };
                                return (
                                    <PreviewCanvas
                                        backgroundUrl={img.url}
                                        backgroundAlt={img.altText}
                                        view={selectedView}
                                        colorHex={selectedColor}
                                        {...textProps}
                                        {...imageProps}
                                        showDesignArea
                                        designArea={
                                            designAreaPercent[selectedView]
                                        }
                                    />
                                );
                            })()}

                            {/* Selection summary */}
                            <div className="mt-4 text-sm font-extrabold text-gray-700">
                                Selected: {selectedVariant?.title || "Default"}{" "}
                                • View: {selectedView}
                                {selectedColor && ` • Color: ${selectedColor}`}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
