import type {
	ProductCustomization,
	CartCustomAttributes,
} from "@/types/customization";

// Environment variables validation
const SHOPIFY_STORE_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const SHOPIFY_STOREFRONT_TOKEN =
	process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_STOREFRONT_TOKEN) {
	throw new Error(
		"Missing required environment variables: NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN and NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN"
	);
}

const VALIDATED_STORE_DOMAIN: string = SHOPIFY_STORE_DOMAIN;
const VALIDATED_STOREFRONT_TOKEN: string = SHOPIFY_STOREFRONT_TOKEN;

export interface CartItem {
	id: string;
	quantity: number;
	merchandise: {
		id: string;
		title: string;
		selectedOptions: Array<{
			name: string;
			value: string;
		}>;
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
	attributes: Array<{
		key: string;
		value: string;
	}>;
}

export interface Cart {
	id: string;
	lines: {
		edges: Array<{
			node: CartItem;
		}>;
	};
	cost: {
		totalAmount: {
			amount: string;
			currencyCode: string;
		};
		subtotalAmount: {
			amount: string;
			currencyCode: string;
		};
	};
	checkoutUrl: string;
}

const CREATE_CART_MUTATION = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  selectedOptions {
                    name
                    value
                  }
                  product {
                    id
                    title
                    handle
                    featuredImage {
                      url
                      altText
                    }
                  }
                }
              }
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              attributes {
                key
                value
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
        }
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const ADD_TO_CART_MUTATION = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  selectedOptions {
                    name
                    value
                  }
                  product {
                    id
                    title
                    handle
                    featuredImage {
                      url
                      altText
                    }
                  }
                }
              }
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              attributes {
                key
                value
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
        }
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const REMOVE_FROM_CART_MUTATION = `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        id
        lines(first: 100) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  selectedOptions {
                    name
                    value
                  }
                  product {
                    id
                    title
                    handle
                    featuredImage {
                      url
                      altText
                    }
                  }
                }
              }
              cost {
                totalAmount {
                  amount
                  currencyCode
                }
              }
              attributes {
                key
                value
              }
            }
          }
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
          subtotalAmount {
            amount
            currencyCode
          }
        }
        checkoutUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const GET_CART_QUERY = `
  query cart($id: ID!) {
    cart(id: $id) {
      id
      lines(first: 100) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                selectedOptions {
                  name
                  value
                }
                product {
                  id
                  title
                  handle
                  featuredImage {
                    url
                    altText
                  }
                }
              }
            }
            cost {
              totalAmount {
                amount
                currencyCode
              }
            }
            attributes {
              key
              value
            }
          }
        }
      }
      cost {
        totalAmount {
          amount
          currencyCode
        }
        subtotalAmount {
          amount
          currencyCode
        }
      }
      checkoutUrl
    }
  }
`;

export class ShopifyCartAPI {
	private endpoint: string;
	private headers: HeadersInit;

	constructor() {
		this.endpoint = `${VALIDATED_STORE_DOMAIN}/api/2023-01/graphql.json`;
		this.headers = {
			"Content-Type": "application/json",
			"X-Shopify-Storefront-Access-Token": VALIDATED_STOREFRONT_TOKEN,
		};
	}

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
			console.error("Shopify Cart API error:", error);
			throw error;
		}
	}

	/**
	 * Create a new cart with customized product
	 */
	async createCartWithCustomization(
		variantId: string,
		quantity: number,
		customization: ProductCustomization,
		previewImageUrl?: string
	): Promise<Cart> {
		// Custom attributes for cart
		const attributes: Array<{ key: string; value: string }> = [
			{
				key: "_customization_data",
				value: JSON.stringify(customization),
			},
			{
				key: "Customization",
				value: this.generateCustomizationSummary(customization),
			},
			{
				key: "_custom_price",
				value: `$${customization.totalPrice.toFixed(2)}`,
			},
			{
				key: "_has_customization",
				value: "true",
			},
		];

		if (previewImageUrl) {
			attributes.push({
				key: "_preview_image_url",
				value: previewImageUrl,
			});
		}

		if (customization.selectedColor) {
			attributes.push({
				key: "_custom_color",
				value: customization.selectedColor,
			});
		}

		const input = {
			lines: [
				{
					merchandiseId: variantId,
					quantity,
					attributes,
				},
			],
		};

		const data = await this.query<{
			cartCreate: { cart: Cart; userErrors: any[] };
		}>(CREATE_CART_MUTATION, { input });

		if (data.cartCreate.userErrors.length > 0) {
			throw new Error(data.cartCreate.userErrors[0].message);
		}

		return data.cartCreate.cart;
	}

	/**
	 * Add customized product to existing cart
	 */
	async addCustomizedProductToCart(
		cartId: string,
		variantId: string,
		quantity: number,
		customization: ProductCustomization,
		previewImageUrl?: string
	): Promise<Cart> {
		// Custom attributes for cart
		const attributes: Array<{ key: string; value: string }> = [
			{
				key: "_customization_data",
				value: JSON.stringify(customization),
			},
			{
				key: "Customization",
				value: this.generateCustomizationSummary(customization),
			},
			{
				key: "_custom_price",
				value: `$${customization.totalPrice.toFixed(2)}`,
			},
			{
				key: "_has_customization",
				value: "true",
			},
		];

		if (previewImageUrl) {
			attributes.push({
				key: "_preview_image_url",
				value: previewImageUrl,
			});
		}

		if (customization.selectedColor) {
			attributes.push({
				key: "_custom_color",
				value: customization.selectedColor,
			});
		}

		const lines = [
			{
				merchandiseId: variantId,
				quantity,
				attributes,
			},
		];

		const data = await this.query<{
			cartLinesAdd: { cart: Cart; userErrors: any[] };
		}>(ADD_TO_CART_MUTATION, { cartId, lines });

		if (data.cartLinesAdd.userErrors.length > 0) {
			throw new Error(data.cartLinesAdd.userErrors[0].message);
		}

		return data.cartLinesAdd.cart;
	}

	/**
	 * Get cart by ID
	 */
	async getCart(cartId: string): Promise<Cart> {
		const data = await this.query<{ cart: Cart }>(GET_CART_QUERY, {
			id: cartId,
		});
		return data.cart;
	}

	/**
	 * Remove item from cart
	 */
	async removeFromCart(cartId: string, lineId: string): Promise<Cart> {
		const data = await this.query<{
			cartLinesRemove: { cart: Cart; userErrors: any[] };
		}>(REMOVE_FROM_CART_MUTATION, { cartId, lineIds: [lineId] });

		if (data.cartLinesRemove.userErrors.length > 0) {
			throw new Error(data.cartLinesRemove.userErrors[0].message);
		}

		return data.cartLinesRemove.cart;
	}

	/**
	 * Extract customization data from cart item
	 */
	getCustomizationFromCartItem(
		cartItem: CartItem
	): ProductCustomization | null {
		const customizationAttr = cartItem.attributes.find(
			(attr) => attr.key === "_customization_data"
		);

		if (!customizationAttr) return null;

		try {
			return JSON.parse(customizationAttr.value) as ProductCustomization;
		} catch (error) {
			console.error("Error parsing customization data:", error);
			return null;
		}
	}

	/**
	 * Check if cart item has customizations
	 */
	hasCustomization(cartItem: CartItem): boolean {
		return cartItem.attributes.some(
			(attr) => attr.key === "_has_customization" && attr.value === "true"
		);
	}

	/**
	 * Generate a readable summary of customization
	 */
	private generateCustomizationSummary(
		customization: ProductCustomization
	): string {
		const parts: string[] = [];

		// Shirt Color
		if (customization.selectedColor) {
			parts.push(`Shirt Color: ${customization.selectedColor}`);
		}

		// Check if any text exists
		const hasText = customization.views.some(
			(view) => view.textOverlays.length > 0
		);
		parts.push(`Custom Text: ${hasText ? "true" : "false"}`);

		// Text Color (from first text overlay found)
		if (hasText) {
			const firstTextOverlay = customization.views
				.flatMap((view) => view.textOverlays)
				.find((text) => text);
			if (firstTextOverlay) {
				parts.push(`Text Color: ${firstTextOverlay.color}`);
			}
		}

		// Location-specific text
		customization.views.forEach((view) => {
			if (view.textOverlays.length > 0) {
				view.textOverlays.forEach((textOverlay) => {
					parts.push(`${view.view} Text: ${textOverlay.text}`);
				});
			}
		});

		// Total images count
		const totalImages = customization.views.reduce(
			(total, view) => total + view.imageOverlays.length,
			0
		);
		if (totalImages > 0) {
			parts.push(`Images: ${totalImages} uploaded`);
		}

		return parts.join(" • ") || "Custom design";
	}
}

// Singleton instance
export const shopifyCart = new ShopifyCartAPI();

// Helper functions for cart management in localStorage
export const CartStorage = {
	CART_ID_KEY: "shopify_cart_id",

	getCartId(): string | null {
		if (typeof window === "undefined") return null;
		return localStorage.getItem(this.CART_ID_KEY);
	},

	setCartId(cartId: string): void {
		if (typeof window === "undefined") return;
		localStorage.setItem(this.CART_ID_KEY, cartId);
	},

	clearCartId(): void {
		if (typeof window === "undefined") return;
		localStorage.removeItem(this.CART_ID_KEY);
	},
};
