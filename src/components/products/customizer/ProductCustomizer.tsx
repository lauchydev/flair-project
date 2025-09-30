"use client";

import { useState } from "react";
import { getColorImageMap } from "@/lib/customizer/assets";
import { usePriceDisplay } from "./hooks/usePriceDisplay";
import { useCartOperations } from "./hooks/useCartOperations";
import { useViewCustomizations } from "./hooks/useViewCustomizations";
import { useProductConfiguration } from "./hooks/useProductConfiguration";
import ControlsPanel from "./components/ControlsPanel";
import PreviewSection from "./components/PreviewSection";

export default function ProductCustomizer({ product }: { product: any }) {
    const config = useProductConfiguration(product);
    const viewState = useViewCustomizations(
        config.areaCenters[config.availableViews[0] || "front"]
    );
    const priceDisplay = usePriceDisplay(product, config.selectedVariant, {
        addText: config.enableCustomText && !!viewState.customText,
        textPrice: config.textPrice,
        addImage: config.enableCustomImage && !!viewState.activeImageUrl,
        imagePrice: config.imagePrice,
        addColor: !!(
            config.enableCustomColor &&
            config.selectedColor &&
            config.availableColours.length > 0 &&
            config.selectedColor !== config.availableColours[0]
        ),
        colorPrice: config.colorPrice,
    });
    const [quantity, setQuantity] = useState(1);
    const cart = useCartOperations({
        product,
        enableCustomText: config.enableCustomText,
        enableCustomImage: config.enableCustomImage,
        enableCustomColor: config.enableCustomColor,
        availableColours: config.availableColours,
    });

    const handleAddToCart = () =>
        cart.handleAddToCart(
            config.selectedVariantId,
            quantity,
            config.selectedColor,
            viewState.selectedView,
            viewState.viewCustomizations,
            config.selectedVariant,
            viewState.customText,
            viewState.activeImageUrl
        );

    const updateViewText = (field: string, value: string) =>
        viewState.setViewCustomizations((prev) => ({
            ...prev,
            [viewState.selectedView]: {
                ...prev[viewState.selectedView],
                [field]: value,
            },
        }));

    return (
        <div className="bg-gradient-to-b from-yellow-50 to-purple-50 py-10">
            <div className="container mx-auto px-4">
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <ControlsPanel
                        optionNames={config.optionNames}
                        optionValues={config.optionValues}
                        selectedOptions={config.selectedOptions}
                        isOptionAvailable={config.isOptionAvailable}
                        onSelectedOptionsChange={(name, value) =>
                            config.setSelectedOptions((prev) => ({
                                ...prev,
                                [name]: value,
                            }))
                        }
                        enableCustomColor={config.enableCustomColor}
                        enableCustomText={config.enableCustomText}
                        enableCustomImage={config.enableCustomImage}
                        availableColours={config.availableColours}
                        selectedColor={config.selectedColor}
                        onColorSelect={config.setSelectedColor}
                        colorPrice={config.colorPrice}
                        currentViewCustomization={
                            viewState.currentViewCustomization
                        }
                        selectedView={viewState.selectedView}
                        currentCenter={
                            config.areaCenters[viewState.selectedView]
                        }
                        onViewCustomizationsChange={
                            viewState.setViewCustomizations
                        }
                        imagePrice={config.imagePrice}
                        customText={viewState.customText}
                        onTextChange={(text) => updateViewText("text", text)}
                        textPrice={config.textPrice}
                        textFont={viewState.textFont}
                        textColor={viewState.textColor}
                        onFontChange={(font) =>
                            updateViewText("textFont", font)
                        }
                        onColorChange={(color) =>
                            updateViewText("textColor", color)
                        }
                        quantity={quantity}
                        onQuantityChange={setQuantity}
                        onAddToCart={handleAddToCart}
                        priceDisplay={priceDisplay}
                        isLoading={false}
                        cartError={cart.cartError}
                        cartSuccess={cart.cartSuccess}
                        isAddingToCart={cart.isAddingToCart}
                    />
                    <PreviewSection
                        product={product}
                        selectedVariant={config.selectedVariant}
                        availableViews={config.availableViews}
                        selectedView={viewState.selectedView}
                        onViewSelect={viewState.setSelectedView}
                        availableColours={config.availableColours}
                        selectedColor={config.selectedColor}
                        currentViewCustomization={
                            viewState.currentViewCustomization
                        }
                        designAreaPercent={config.designAreaPercent}
                        getColorImageMap={getColorImageMap}
                        currentCenter={
                            config.areaCenters[viewState.selectedView]
                        }
                        onViewCustomizationsChange={
                            viewState.setViewCustomizations
                        }
                        customText={viewState.customText}
                        textPos={viewState.textPos}
                        textColor={viewState.textColor}
                        textFont={viewState.textFont}
                        textWidthPercent={viewState.textWidthPercent}
                        textHeightPercent={viewState.textHeightPercent}
                        textAngleDeg={viewState.textAngleDeg}
                        activeImageUrl={viewState.activeImageUrl}
                        otherImages={viewState.otherImages}
                        imagePos={viewState.imagePos}
                        imageWidthPercent={viewState.imageWidthPercent}
                        imageHeightPercent={viewState.imageHeightPercent}
                        imageAngleDeg={viewState.imageAngleDeg}
                    />
                </div>
            </div>
        </div>
    );
}
