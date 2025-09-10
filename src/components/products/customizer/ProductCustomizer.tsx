"use client";

import { useEffect, useMemo, useState } from "react";
import type { ShopifyProduct } from "@/types/api/shopify";
import { getAvailableViewsForProduct } from "@/lib/customizer/config";
import { getColorImageMap } from "@/lib/customizer/assets";
import {
    parseMetafieldBoolean,
    parseColorMetafield,
    parsePriceModifier,
} from "@/lib/customizer/metafields";
import type { ViewPose } from "./types";
import VariantOptions from "./controls/VariantOptions";
import ColorPicker from "./controls/ColorPicker";
import TextInput from "./controls/TextInput";
import ImageUpload from "./controls/ImageUpload";
import ViewSwitcher from "./controls/ViewSwitcher";
import QuantityStepper from "./controls/QuantityStepper";
import PreviewCanvas from "./PreviewCanvas";
import { useVariantOptions } from "./hooks/useVariantOptions";
import { usePriceDisplay } from "./hooks/usePriceDisplay";
import TextStyle from "./controls/TextStyle";

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

    // Extend viewCustomizations initial state
    const [viewCustomizations, setViewCustomizations] = useState({
        front: {
            text: "",
            uploadedImage: null,
            textPos: { x: 50, y: 85 },
            imagePos: { x: 85, y: 15 },
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
            textPos: { x: 50, y: 85 },
            imagePos: { x: 85, y: 15 },
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
    const uploadedImage = currentViewCustomization.uploadedImage;
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
        addImage: enableCustomImage && !!uploadedImage,
        imagePrice,
    });

    // Variant selection logic
    // isOptionAvailable now comes from the hook

    const defaultDesignArea = { x: 28, y: 23, width: 44, height: 50 };

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
                                uploadedImageUrl={uploadedImage}
                                onSelect={(url) =>
                                    setViewCustomizations((prev) => ({
                                        ...prev,
                                        [selectedView]: {
                                            ...prev[selectedView],
                                            uploadedImage: url,
                                        },
                                    }))
                                }
                                onClear={() =>
                                    setViewCustomizations((prev) => ({
                                        ...prev,
                                        [selectedView]: {
                                            ...prev[selectedView],
                                            uploadedImage: null,
                                        },
                                    }))
                                }
                                priceDelta={imagePrice}
                            />
                        )}

                        {/* Add text (metafield controlled) */}
                        {enableCustomText && (
                            <TextInput
                                value={customText}
                                onChange={(val) =>
                                    setViewCustomizations((prev) => ({
                                        ...prev,
                                        [selectedView]: {
                                            ...prev[selectedView],
                                            text: val,
                                        },
                                    }))
                                }
                                priceDelta={textPrice}
                            />
                        )}

                        {/* Text style (font + color) */}
                        {enableCustomText && (
                            <TextStyle
                                fontFamily={textFont}
                                colorHex={textColor}
                                onFontChange={(font) =>
                                    setViewCustomizations((prev) => ({
                                        ...prev,
                                        [selectedView]: {
                                            ...prev[selectedView],
                                            textFont: font,
                                        },
                                    }))
                                }
                                onColorChange={(hex) =>
                                    setViewCustomizations((prev) => ({
                                        ...prev,
                                        [selectedView]: {
                                            ...prev[selectedView],
                                            textColor: hex,
                                        },
                                    }))
                                }
                            />
                        )}

                        {/* Price + Actions bar */}
                        <section>
                            <div className="flex items-center gap-3 rounded-2xl border-4 border-black bg-white px-3 py-3 shadow-xl">
                                {/* Quantity stepper */}
                                <QuantityStepper
                                    value={quantity}
                                    onChange={setQuantity}
                                />

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
                                                custom_text_front:
                                                    viewCustomizations.front
                                                        .text,
                                                custom_text_back:
                                                    viewCustomizations.back
                                                        .text,
                                                custom_color: selectedColor,
                                                custom_image_front:
                                                    viewCustomizations.front
                                                        .uploadedImage,
                                                custom_image_back:
                                                    viewCustomizations.back
                                                        .uploadedImage,
                                                selected_view: selectedView, // DEBUGGING
                                            },
                                        });
                                    }}
                                >
                                    Add to cart
                                </button>

                                {/* Price display (right aligned) */}
                                <div className="ml-auto w-max rounded-xl border-2 border-black bg-white px-4 py-2 text-right">
                                    <div className="text-xl font-black text-black">
                                        {priceDisplay}
                                    </div>
                                </div>
                            </div>
                            <div className="mt-2 text-xs font-semibold text-gray-600">
                                Prices are estimates. Final price updates as you
                                customize.
                            </div>
                        </section>
                    </aside>

                    {/* Preview Panel */}
                    <section className="lg:col-span-8">
                        <div className="rounded-3xl border-4 border-black bg-white p-4 shadow-xl">
                            {/* View switcher */}
                            {/* TODO: Fix view changer, each view should display a different image of the product, 
              should carry over colour and changes on each view (images, text and placement) should be saved on each view */}
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
                                return (
                                    <PreviewCanvas
                                        backgroundUrl={img.url}
                                        backgroundAlt={img.altText}
                                        view={selectedView}
                                        colorHex={selectedColor}
                                        text={customText}
                                        textPosition={textPos}
                                        onTextPositionChange={(pos) =>
                                            setViewCustomizations((prev) => ({
                                                ...prev,
                                                [selectedView]: {
                                                    ...prev[selectedView],
                                                    textPos: pos,
                                                },
                                            }))
                                        }
                                        textColor={textColor}
                                        textFont={textFont}
                                        textWidthPercent={textWidthPercent}
                                        onTextWidthPercentChange={(w) =>
                                            setViewCustomizations((prev) => ({
                                                ...prev,
                                                [selectedView]: {
                                                    ...prev[selectedView],
                                                    textWidthPercent: w,
                                                },
                                            }))
                                        }
                                        textHeightPercent={textHeightPercent}
                                        onTextHeightPercentChange={(h) =>
                                            setViewCustomizations((prev) => ({
                                                ...prev,
                                                [selectedView]: {
                                                    ...prev[selectedView],
                                                    textHeightPercent: h,
                                                },
                                            }))
                                        }
                                        textAngleDeg={textAngleDeg}
                                        onTextAngleDegChange={(a) =>
                                            setViewCustomizations((prev) => ({
                                                ...prev,
                                                [selectedView]: {
                                                    ...prev[selectedView],
                                                    textAngleDeg: a,
                                                },
                                            }))
                                        }
                                        uploadedImageUrl={uploadedImage}
                                        imagePosition={imagePos}
                                        onImagePositionChange={(pos) =>
                                            setViewCustomizations((prev) => ({
                                                ...prev,
                                                [selectedView]: {
                                                    ...prev[selectedView],
                                                    imagePos: pos,
                                                },
                                            }))
                                        }
                                        imageWidthPercent={imageWidthPercent}
                                        imageHeightPercent={imageHeightPercent}
                                        imageAngleDeg={imageAngleDeg}
                                        onImageWidthPercentChange={(w) =>
                                            setViewCustomizations((prev) => ({
                                                ...prev,
                                                [selectedView]: {
                                                    ...prev[selectedView],
                                                    imageWidthPercent: w,
                                                },
                                            }))
                                        }
                                        onImageHeightPercentChange={(h) =>
                                            setViewCustomizations((prev) => ({
                                                ...prev,
                                                [selectedView]: {
                                                    ...prev[selectedView],
                                                    imageHeightPercent: h,
                                                },
                                            }))
                                        }
                                        onImageAngleDegChange={(a) =>
                                            setViewCustomizations((prev) => ({
                                                ...prev,
                                                [selectedView]: {
                                                    ...prev[selectedView],
                                                    imageAngleDeg: a,
                                                },
                                            }))
                                        }
                                        showDesignArea
                                        designArea={defaultDesignArea}
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
