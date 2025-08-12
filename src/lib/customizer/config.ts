import type { ShopifyProduct } from "@/types/api/shopify";

export type ViewPose = "front" | "back" | "left" | "right";

type ProductViewConfig = {
  // allowed preview views for this product
  views: ViewPose[];
};


const PRODUCT_VIEW_CONFIG: Record<string, ProductViewConfig> = {
  // "customize-your-t-shirt": { views: ["front", "back", "left", "right"] },
};

const PRODUCT_TYPE_CONFIG: Record<string, ProductViewConfig> = {
  // e.g., T-Shirt-like products
  TSHIRT: { views: ["front", "back", "left", "right"] },
  BOTTLE: { views: ["front", "back"] },
};

export function getAvailableViewsForProduct(product: ShopifyProduct): ViewPose[] {
  const handleKey = (product.handle || "").toLowerCase();
  const typeKey = (product.productType || "").toUpperCase();

  if (PRODUCT_VIEW_CONFIG[handleKey]) return PRODUCT_VIEW_CONFIG[handleKey].views;
  if (PRODUCT_TYPE_CONFIG[typeKey]) return PRODUCT_TYPE_CONFIG[typeKey].views;

  // default
  return ["front", "back"];
}

