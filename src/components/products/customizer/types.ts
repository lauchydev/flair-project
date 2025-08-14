import type { ShopifyProduct, ShopifyVariant } from "@/types/api/shopify";

export type ViewPose = "front" | "back" | "left" | "right";

export interface CustomizationState {
  variantId: string | null;
  colorHex: string | null;
  view: ViewPose;
  uploadedImageUrl: string | null;
  text: string;
}

export interface ProductWithVariants extends ShopifyProduct {
  variants: ShopifyProduct["variants"];
}

export type VariantResolver = (product: ShopifyProduct, id: string | null) => ShopifyVariant | null;

