import VariantOptions from "../controls/VariantOptions";
import ColorPicker from "../controls/ColorPicker";
import TextInput from "../controls/TextInput";
import ImageUpload from "../controls/ImageUpload";
import TextStyle from "../controls/TextStyle";
import PriceActionsBar from "./PriceActionsBar";
import type { ViewPose } from "../types";

interface ControlsPanelProps {
    // Variant options
    optionNames: string[];
    optionValues: Record<string, string[]>;
    selectedOptions: Record<string, string>;
    isOptionAvailable: (optionName: string, value: string) => boolean;
    onSelectedOptionsChange: (name: string, value: string) => void;

    // Feature flags
    enableCustomColor: boolean;
    enableCustomText: boolean;
    enableCustomImage: boolean;

    // Color selection
    availableColours: string[];
    selectedColor: string | null;
    onColorSelect: (color: string) => void;
    colorPrice: number;

    // Image upload
    currentViewCustomization: any;
    selectedView: ViewPose;
    currentCenter: { x: number; y: number };
    onViewCustomizationsChange: (updater: (prev: any) => any) => void;
    imagePrice: number;

    // Text input
    customText: string;
    onTextChange: (text: string) => void;
    textPrice: number;

    // Text style
    textFont: string;
    textColor: string;
    onFontChange: (font: string) => void;
    onColorChange: (color: string) => void;

    // Price and actions
    quantity: number;
    onQuantityChange: (quantity: number) => void;
    onAddToCart: () => void;
    priceDisplay: any;
    isLoading: boolean;

    // Cart state
    cartError: string | null;
    cartSuccess: boolean;
    isAddingToCart: boolean;
}

export default function ControlsPanel({
    // Variant options
    optionNames,
    optionValues,
    selectedOptions,
    isOptionAvailable,
    onSelectedOptionsChange,

    // Feature flags
    enableCustomColor,
    enableCustomText,
    enableCustomImage,

    // Color selection
    availableColours,
    selectedColor,
    onColorSelect,
    colorPrice,

    // Image upload
    currentViewCustomization,
    selectedView,
    currentCenter,
    onViewCustomizationsChange,
    imagePrice,

    // Text input
    customText,
    onTextChange,
    textPrice,

    // Text style
    textFont,
    textColor,
    onFontChange,
    onColorChange,

    // Price and actions
    quantity,
    onQuantityChange,
    onAddToCart,
    priceDisplay,
    isLoading,

    // Cart state
    cartError,
    cartSuccess,
    isAddingToCart,
}: ControlsPanelProps) {
    const updateView = (patch: any) => {
        onViewCustomizationsChange((prev) => ({
            ...prev,
            [selectedView]: { ...prev[selectedView], ...patch },
        }));
    };

    return (
        <aside className="lg:col-span-4 space-y-6">
            {/* Variant select (size, etc.) */}
            <VariantOptions
                optionNames={optionNames}
                optionValues={optionValues}
                selectedOptions={selectedOptions}
                isOptionAvailable={isOptionAvailable}
                onChange={onSelectedOptionsChange}
            />

            {/* Color selection (metafield controlled) */}
            {enableCustomColor && (
                <ColorPicker
                    colors={availableColours}
                    selectedColor={selectedColor}
                    onSelect={onColorSelect}
                    priceDelta={
                        selectedColor &&
                        availableColours.length > 0 &&
                        selectedColor !== availableColours[0]
                            ? colorPrice
                            : 0
                    }
                />
            )}

            {/* Upload image (metafield controlled) */}
            {enableCustomImage && (
                <ImageUpload
                    images={currentViewCustomization.uploadedImages}
                    activeIndex={currentViewCustomization.activeImageIndex}
                    onAdd={(urls: string[]) =>
                        onViewCustomizationsChange((prev) => {
                            const view = prev[selectedView];
                            const existing = view.uploadedImages ?? [];
                            const combined = [...existing, ...urls];
                            const newOverlays = [
                                ...(view.imageOverlays ?? []),
                                ...urls.map((u: string) => ({
                                    url: u,
                                    x: currentCenter.x,
                                    y: currentCenter.y,
                                    widthPercent: view.imageWidthPercent,
                                    heightPercent: view.imageHeightPercent,
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
                                    uploadedImage: combined[nextActive] ?? null,
                                },
                            };
                        })
                    }
                    onRemove={(index: number) =>
                        onViewCustomizationsChange((prev) => {
                            const view = prev[selectedView];
                            const imgs = [...(view.uploadedImages ?? [])];
                            imgs.splice(index, 1);
                            const overlays = [...(view.imageOverlays ?? [])];
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
                                        nextActive !== null && imgs[nextActive]
                                            ? imgs[nextActive]
                                            : null,
                                },
                            };
                        })
                    }
                    onMakeActive={(index: number) =>
                        onViewCustomizationsChange((prev) => {
                            const view = prev[selectedView];
                            const imgs = view.uploadedImages ?? [];
                            const overlay = (view.imageOverlays ?? [])[index];
                            return {
                                ...prev,
                                [selectedView]: {
                                    ...view,
                                    activeImageIndex: index,
                                    uploadedImage: imgs[index] ?? null,
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
                                        overlay?.angleDeg ?? view.imageAngleDeg,
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
                    onChange={onTextChange}
                    priceDelta={textPrice}
                />
            )}

            {/* Text style (font + color) */}
            {enableCustomText && (
                <TextStyle
                    fontFamily={textFont}
                    colorHex={textColor}
                    onFontChange={onFontChange}
                    onColorChange={onColorChange}
                />
            )}

            {/* Price + Actions bar */}
            <PriceActionsBar
                quantity={quantity}
                onQuantityChange={onQuantityChange}
                onAddToCart={onAddToCart}
                priceDisplay={priceDisplay}
                isLoading={isLoading}
            />

            {/* Cart feedback states */}
            {cartError && (
                <div className="mt-4 rounded-2xl border-3 border-red-500 bg-gradient-to-r from-red-50 to-red-100 p-4 shadow-lg">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                    !
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-black text-red-800 mb-1">
                                Cart Error
                            </h4>
                            <p className="text-sm font-semibold text-red-700 leading-relaxed">
                                {cartError}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {cartSuccess && (
                <div className="mt-4 rounded-2xl border-3 border-green-500 bg-gradient-to-r from-green-50 to-green-100 p-4 shadow-lg">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                    ✔
                                </span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-black text-green-800 mb-1">
                                Success!
                            </h4>
                            <p className="text-sm font-semibold text-green-700 mb-3 leading-relaxed">
                                Product added to cart successfully
                            </p>
                            <a
                                href="/cart"
                                className="inline-flex items-center gap-2 rounded-xl border-2 border-green-600 bg-green-600 px-4 py-2 text-xs font-black text-white shadow-md transition-all hover:bg-green-500 hover:border-green-500 hover:shadow-lg"
                            >
                                <span>View Cart</span>
                                <span className="text-green-200">→</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {isAddingToCart && (
                <div className="mt-4 rounded-2xl border-3 border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-black text-blue-800">
                                Adding to cart...
                            </p>
                            <p className="text-xs font-semibold text-blue-600 mt-1">
                                Please wait while we save your customization
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
