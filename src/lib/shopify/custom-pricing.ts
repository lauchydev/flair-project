import { ProductCustomization } from "@/types/customization";

/**
 * Enhanced cart line item with custom pricing support
 */
export interface CustomPricedCartItem {
    id: string;
    quantity: number;
    merchandise: {
        id: string;
        title: string;
        selectedOptions: { name: string; value: string }[];
        product: {
            id: string;
            title: string;
            handle: string;
            featuredImage?: {
                url: string;
                altText?: string;
            };
        };
    };
    cost: {
        totalAmount: {
            amount: string;
            currencyCode: string;
        };
    };
    attributes: Array<{ key: string; value: string }>;
    // Calculated custom pricing
    customPricing?: {
        basePrice: number;
        textPrice: number;
        imagePrice: number;
        colorPrice: number;
        totalPrice: number;
        hasCustomPricing: boolean;
    };
}

/**
 * Extract custom pricing from cart line item attributes
 */
export function extractCustomPricing(
    item: any
): CustomPricedCartItem["customPricing"] {
    const attributes = item.attributes || [];

    const getAttributeValue = (key: string): string | null => {
        const attr = attributes.find((a: any) => a.key === key);
        return attr?.value || null;
    };

    const hasCustomization = getAttributeValue("_has_customization") === "true";

    if (!hasCustomization) {
        return {
            basePrice: parseFloat(item.cost.totalAmount.amount),
            textPrice: 0,
            imagePrice: 0,
            colorPrice: 0,
            totalPrice: parseFloat(item.cost.totalAmount.amount),
            hasCustomPricing: false,
        };
    }

    const basePrice = parseFloat(
        getAttributeValue("_base_price") || item.cost.totalAmount.amount
    );
    const textPrice = parseFloat(getAttributeValue("_text_price") || "0");
    const imagePrice = parseFloat(getAttributeValue("_image_price") || "0");
    const colorPrice = parseFloat(getAttributeValue("_color_price") || "0");
    const totalPrice = basePrice + textPrice + imagePrice + colorPrice;

    return {
        basePrice,
        textPrice,
        imagePrice,
        colorPrice,
        totalPrice,
        hasCustomPricing: true,
    };
}

/**
 * Enhanced attributes for custom pricing
 */
export function createCustomPricingAttributes(
    customization: ProductCustomization
): Array<{ key: string; value: string }> {
    return [
        {
            key: "_customization_data",
            value: JSON.stringify(customization),
        },
        {
            key: "Customization",
            value: generateCustomizationSummary(customization),
        },
        // Store detailed pricing breakdown
        {
            key: "_base_price",
            value: customization.basePrice.toString(),
        },
        {
            key: "_text_price",
            value: customization.textPrice.toString(),
        },
        {
            key: "_image_price",
            value: customization.imagePrice.toString(),
        },
        {
            key: "_color_price",
            value: customization.colorPrice.toString(),
        },
        {
            key: "_custom_total_price",
            value: customization.totalPrice.toString(),
        },
        {
            key: "_custom_price_display",
            value: `$${customization.totalPrice.toFixed(2)}`,
        },
        {
            key: "_has_customization",
            value: "true",
        },
        // Line item properties for checkout (Shopify standard)
        {
            key: "Custom Price",
            value: `$${customization.totalPrice.toFixed(2)}`,
        },
        {
            key: "Base Price",
            value: `$${customization.basePrice.toFixed(2)}`,
        },
    ];
}

/**
 * Generate customization summary
 */
function generateCustomizationSummary(
    customization: ProductCustomization
): string {
    const parts: string[] = [];

    // Add view customizations
    customization.views.forEach((view) => {
        const viewParts: string[] = [];

        if (view.textOverlays.length > 0) {
            view.textOverlays.forEach((text) => {
                viewParts.push(`Text: "${text.text}"`);
            });
        }

        if (view.imageOverlays.length > 0) {
            viewParts.push(`${view.imageOverlays.length} custom image(s)`);
        }

        if (viewParts.length > 0) {
            parts.push(
                `${
                    view.view.charAt(0).toUpperCase() + view.view.slice(1)
                }: ${viewParts.join(", ")}`
            );
        }
    });

    if (customization.selectedColor) {
        parts.push(`Color: ${customization.selectedColor}`);
    }

    // Add pricing breakdown
    const pricingParts: string[] = [];
    if (customization.textPrice > 0)
        pricingParts.push(`+$${customization.textPrice.toFixed(2)} text`);
    if (customization.imagePrice > 0)
        pricingParts.push(`+$${customization.imagePrice.toFixed(2)} image`);
    if (customization.colorPrice > 0)
        pricingParts.push(`+$${customization.colorPrice.toFixed(2)} color`);

    if (pricingParts.length > 0) {
        parts.push(
            `Pricing: Base $${customization.basePrice.toFixed(
                2
            )} ${pricingParts.join(" ")} = $${customization.totalPrice.toFixed(
                2
            )}`
        );
    }

    return parts.join("\n");
}

/**
 * Calculate total cart price with custom pricing
 */
export function calculateCustomCartTotal(items: CustomPricedCartItem[]): {
    subtotal: number;
    total: number;
    currencyCode: string;
} {
    let subtotal = 0;
    let currencyCode = "AUD";

    items.forEach((item) => {
        if (item.customPricing?.hasCustomPricing) {
            subtotal += item.customPricing.totalPrice * item.quantity;
        } else {
            subtotal +=
                parseFloat(item.cost.totalAmount.amount) * item.quantity;
        }
        currencyCode = item.cost.totalAmount.currencyCode;
    });

    return {
        subtotal,
        total: subtotal, // Add taxes/shipping here if needed
        currencyCode,
    };
}
