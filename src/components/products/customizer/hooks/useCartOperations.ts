import { useState } from "react";
import type { ShopifyProduct } from "@/types/api/shopify";
import type { CustomizerState } from "@/types/customization";
import type { ViewPose } from "../types";
import { shopifyCart, CartStorage } from "@/lib/shopify/customization-cart";
import {
	convertCustomizerStateToCustomization,
	validateCustomization,
} from "@/lib/customization/utils";
import { generatePreviewDataUrl } from "@/lib/customization/preview";
import { convertBlobUrlsToBase64 } from "@/lib/utils/image-conversion";
import { refreshCartCount } from "@/lib/cart/events";
import { getColorImageMap } from "@/lib/customizer/assets";
import { parsePriceModifier } from "@/lib/customizer/metafields";

interface CartOperationState {
	isAddingToCart: boolean;
	cartError: string | null;
	cartSuccess: boolean;
}

interface UseCartOperationsProps {
	product: ShopifyProduct;
	enableCustomText: boolean;
	enableCustomImage: boolean;
	enableCustomColor: boolean;
	availableColours: string[];
}

export function useCartOperations({
	product,
	enableCustomText,
	enableCustomImage,
	enableCustomColor,
	availableColours,
}: UseCartOperationsProps) {
	const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
	const [cartError, setCartError] = useState<string | null>(null);
	const [cartSuccess, setCartSuccess] = useState<boolean>(false);

	const handleAddToCart = async (
		selectedVariantId: string | null,
		quantity: number,
		selectedColor: string | null,
		selectedView: ViewPose,
		viewCustomizations: any,
		selectedVariant: any,
		customText: string,
		activeImageUrl: string | null
	) => {
		if (!selectedVariantId) {
			setCartError("Please select a variant");
			return;
		}

		setIsAddingToCart(true);
		setCartError(null);
		setCartSuccess(false);

		try {
			// Create customizer state object
			const customizerState: CustomizerState = {
				selectedColor,
				quantity,
				selectedView,
				selectedVariantId,
				viewCustomizations,
			};

			// Calculate pricing
			const baseAmount = parseFloat(
				selectedVariant?.price?.amount ??
					product.priceRange.minVariantPrice.amount
			);
			const textPrice =
				enableCustomText &&
				(customText ||
					viewCustomizations.front.text ||
					viewCustomizations.back.text)
					? parsePriceModifier(product.customTextPrice?.value)
					: 0;
			const imagePrice =
				enableCustomImage &&
				(activeImageUrl ||
					viewCustomizations.front.imageOverlays.length > 0 ||
					viewCustomizations.back.imageOverlays.length > 0)
					? parsePriceModifier(product.customImagePrice?.value)
					: 0;
			const colorPrice =
				enableCustomColor && selectedColor
					? parsePriceModifier(product.customColorPrice?.value)
					: 0;
			const totalPrice = baseAmount + textPrice + imagePrice + colorPrice;

			const pricing = {
				basePrice: baseAmount,
				textPrice,
				imagePrice,
				colorPrice,
				totalPrice,
			};

			// Convert to standardized customization format
			const rawCustomization = convertCustomizerStateToCustomization(
				customizerState,
				product,
				pricing
			);

			// Convert blob URLs to base64 to ensure they persist
			let customization;
			try {
				customization = await convertBlobUrlsToBase64(rawCustomization);
			} catch (conversionError) {
				customization = rawCustomization;
			}

			// Validate customization
			const validation = validateCustomization(customization);
			if (!validation.isValid) {
				setCartError(validation.errors.join(", "));
				return;
			}

			// Generate preview image
			let previewImageUrl: string | undefined;
			try {
				const productImageUrl =
					getColorImageMap(
						product,
						availableColours,
						selectedColor,
						selectedView
					)?.url || product.featuredImage?.url;
				if (productImageUrl) {
					previewImageUrl = await generatePreviewDataUrl(customization, {
						productImageUrl,
						view: selectedView,
					});
				}
			} catch (previewError) {
				// Continue without preview image
			}

			// Get or create cart
			let cartId = CartStorage.getCartId();

			if (cartId) {
				// Add to existing cart
				try {
					await shopifyCart.addCustomizedProductToCart(
						cartId,
						selectedVariantId,
						quantity,
						customization,
						previewImageUrl
					);
				} catch (error) {
					// If adding to existing cart fails, create new cart
					const newCart = await shopifyCart.createCartWithCustomization(
						selectedVariantId,
						quantity,
						customization,
						previewImageUrl
					);
					CartStorage.setCartId(newCart.id);
				}
			} else {
				// Create new cart
				const newCart = await shopifyCart.createCartWithCustomization(
					selectedVariantId,
					quantity,
					customization,
					previewImageUrl
				);
				CartStorage.setCartId(newCart.id);
			}

			// Show success message
			setCartSuccess(true);

			// Refresh cart count in header
			refreshCartCount();

			// Auto-hide success message after 5 seconds
			setTimeout(() => setCartSuccess(false), 5000);
		} catch (error) {
			setCartError(
				error instanceof Error ? error.message : "Failed to add to cart"
			);
		} finally {
			setIsAddingToCart(false);
		}
	};

	return {
		// State
		isAddingToCart,
		cartError,
		cartSuccess,
		// Actions
		handleAddToCart,
		setCartError,
		setCartSuccess,
	};
}
