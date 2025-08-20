/**
 * Shopify Storefront API Client
 * Handles all Shopify API interactions
 */

// Environment variables validation
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN =
  process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

// Check if .env.local file exists and is setup correctly
if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
  throw new Error(
    "Check github and add the '.env.local' file to the root"
    // "Missing required environment variables: NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN"
  );
}
// Validated environment variables
const VALIDATED_STORE_DOMAIN: string = SHOPIFY_STORE_DOMAIN;
const VALIDATED_STOREFRONT_TOKEN: string = SHOPIFY_STOREFRONT_TOKEN;

// Metafield Config
import {
  CUSTOMIZER_NAMESPACE,
  METAFIELD_KEYS,
  METAFIELDS,
} from "@/lib/shopify/metafields";

const GET_PRODUCTS_QUERY = `
  query getProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          description
          availableForSale
          publishedAt
          tags
          productType
          vendor
          totalInventory
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
            maxVariantPrice {
              amount
              currencyCode
            }
          }
          featuredImage {
            url
            altText
            width
            height
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                availableForSale
                price {
                  amount
                  currencyCode
                }
                compareAtPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      }
    }
  }
`;

const GET_PRODUCT_QUERY = `
  query getProduct($handle: String!, $identifiers: [HasMetafieldsIdentifier!]!) {
    productByHandle(handle: $handle) {
      id
      title
      handle
      description
      availableForSale
      publishedAt
      tags
      productType
      vendor
      totalInventory
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
        maxVariantPrice {
          amount
          currencyCode
        }
      }
      featuredImage {
        url
        altText
        width
        height
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
      metafields(identifiers: $identifiers) {
        key
        namespace
        type
        value
      }
    }
  }
`;

/**
 * Base Shopify API client
 */
export class ShopifyAPI {
  private endpoint: string;
  private headers: HeadersInit;

  constructor() {
    this.endpoint = `${VALIDATED_STORE_DOMAIN}/api/2023-01/graphql.json`;
    this.headers = {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": VALIDATED_STOREFRONT_TOKEN,
    };
  }

  /**
   * Execute GraphQL query
   */
  private async query<T>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> {
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        throw new Error(`GraphQL error: ${result.errors[0].message}`);
      }

      return result.data;
    } catch (error) {
      console.error("Shopify API error:", error);
      throw error;
    }
  }

  /**
   * Get all products
   */
  async getProducts(first: number = 20) {
    return this.query(GET_PRODUCTS_QUERY, { first });
  }

  /**
   * Get single product by handle
   */
  async getProduct(handle: string) {
    const identifiers = METAFIELD_KEYS.map((key) => ({
      namespace: CUSTOMIZER_NAMESPACE,
      key,
    }));

    const data = await this.query<any>(GET_PRODUCT_QUERY, {
      handle,
      identifiers,
    });

    // Map metafields array
    const product = data?.productByHandle as any;
    if (product && Array.isArray(product.metafields)) {
      const byKey = (k: string) =>
        product.metafields.find(
          (m: any) => m?.key?.toLowerCase() === k.toLowerCase()
        ) || null;

      // Set alias for use using product.alias
      METAFIELDS.forEach((cfg) => {
        const mf = byKey(cfg.key);
        product[cfg.alias] = mf ? { value: mf.value, type: mf.type } : null;
      });
    }

    return data;
  }
}

// Default export for convenience
export const shopify = new ShopifyAPI();
