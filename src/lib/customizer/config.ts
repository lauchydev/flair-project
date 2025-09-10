import type { ShopifyProduct } from "@/types/api/shopify";

export type ViewPose = "front" | "back";

type ProductViewConfig = {
    // allowed preview views for this product
    views: ViewPose[];
};

const PRODUCT_TYPE_CONFIG: Record<string, ProductViewConfig> = {
    // Views depending on the category of item
    TEE: { views: ["front", "back"] },
    BOTTLE: { views: ["front", "back"] },
};

export function getAvailableViewsForProduct(
    product: ShopifyProduct
): ViewPose[] {
    // Get views set in product category
    const typeKey = (product.productType || "").toUpperCase();
    if (PRODUCT_TYPE_CONFIG[typeKey]) return PRODUCT_TYPE_CONFIG[typeKey].views;

    // default
    return ["front", "back"];
}
