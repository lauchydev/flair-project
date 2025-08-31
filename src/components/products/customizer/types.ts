import type { ShopifyProduct, ShopifyVariant } from "@/types/api/shopify";

export type ViewPose = "front" | "back";

export interface CustomizationState {
  variantId: string | null;
  colorHex: string | null;
  view: ViewPose;
  viewCustomizations: Record<ViewPose, ViewCustomization>;
}

export interface ViewCustomization {
  uploadedImageUrl: string | null;
  text: string;
  // Add position/transform data later for drag/drop
}

export interface ProductWithVariants extends ShopifyProduct {
  variants: ShopifyProduct["variants"];
}

export type VariantResolver = (
  product: ShopifyProduct,
  id: string | null
) => ShopifyVariant | null;
