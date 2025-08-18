/**
 * TypeScript types for Shopify Storefront API responses
 */

import type { MetafieldAlias } from "@/lib/shopify/metafields";

export interface ShopifyImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface ShopifyMoney {
  amount: string;
  currencyCode: string;
}

export interface ShopifyPriceRange {
  minVariantPrice: ShopifyMoney;
  maxVariantPrice: ShopifyMoney;
}

export interface ShopifyVariantOption {
  name: string;
  value: string;
}

export interface ShopifyVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: ShopifyMoney;
  compareAtPrice: ShopifyMoney | null;
  selectedOptions: ShopifyVariantOption[];
}

export interface ShopifyProduct extends ShopifyMetafieldsShape {
  id: string;
  title: string;
  handle: string;
  description: string;
  availableForSale: boolean;
  publishedAt: string;
  tags: string[];
  productType: string;
  vendor: string;
  totalInventory: number;
  priceRange: ShopifyPriceRange;
  featuredImage: ShopifyImage | null;
  images: {
    edges: Array<{
      node: ShopifyImage;
    }>;
  };
  variants: {
    edges: Array<{
      node: ShopifyVariant;
    }>;
  };
}

export interface ShopifyProductsResponse {
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
  };
}

export interface ShopifyProductResponse {
  productByHandle: ShopifyProduct | null;
}

/**
 *  Get Metfields from {@link MetafieldAlias }
 */
export type ShopifyMetafieldsShape = {
  [K in MetafieldAlias]?: { value: string; type: string } | null;
};

// Utility types for working with edges pattern
export type ShopifyEdge<T> = {
  node: T;
};

export type ShopifyConnection<T> = {
  edges: Array<ShopifyEdge<T>>;
};

// Helper function to extract nodes from edges
export function extractNodes<T>(connection: ShopifyConnection<T>): T[] {
  return connection.edges.map((edge) => edge.node);
}
