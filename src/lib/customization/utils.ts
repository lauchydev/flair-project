import { v4 as uuidv4 } from "uuid";
import type {
	ProductCustomization,
	CustomizerState,
	TextOverlay,
	ImageOverlay,
	ViewCustomization,
} from "@/types/customization";
import type { ShopifyProduct } from "@/types/api/shopify";

/**
 * Convert ProductCustomizer state to standardized ProductCustomization
 */
export function convertCustomizerStateToCustomization(
	state: CustomizerState,
	product: ShopifyProduct,
	pricing: {
		basePrice: number;
		textPrice: number;
		imagePrice: number;
		colorPrice: number;
		totalPrice: number;
	}
): ProductCustomization {
	const now = new Date().toISOString();

	const views: ViewCustomization[] = [];

	// Convert front view
	if (
		state.viewCustomizations.front.text ||
		state.viewCustomizations.front.imageOverlays.length > 0
	) {
		const frontView: ViewCustomization = {
			view: "front",
			textOverlays: [],
			imageOverlays: [],
		};

		// Add text overlay if present
		if (state.viewCustomizations.front.text) {
			const textOverlay: TextOverlay = {
				id: uuidv4(),
				text: state.viewCustomizations.front.text,
				x: state.viewCustomizations.front.textPos.x,
				y: state.viewCustomizations.front.textPos.y,
				widthPercent: state.viewCustomizations.front.textWidthPercent,
				heightPercent: state.viewCustomizations.front.textHeightPercent,
				angleDeg: state.viewCustomizations.front.textAngleDeg,
				color: state.viewCustomizations.front.textColor,
				font: state.viewCustomizations.front.textFont,
			};
			frontView.textOverlays.push(textOverlay);
		}

		// Add image overlays
		frontView.imageOverlays = state.viewCustomizations.front.imageOverlays.map(
			(img) => ({
				id: uuidv4(),
				url: img.url,
				x: img.x,
				y: img.y,
				widthPercent: img.widthPercent,
				heightPercent: img.heightPercent,
				angleDeg: img.angleDeg,
			})
		);

		views.push(frontView);
	}

	// Convert back view
	if (
		state.viewCustomizations.back.text ||
		state.viewCustomizations.back.imageOverlays.length > 0
	) {
		const backView: ViewCustomization = {
			view: "back",
			textOverlays: [],
			imageOverlays: [],
		};

		// Add text overlay if present
		if (state.viewCustomizations.back.text) {
			const textOverlay: TextOverlay = {
				id: uuidv4(),
				text: state.viewCustomizations.back.text,
				x: state.viewCustomizations.back.textPos.x,
				y: state.viewCustomizations.back.textPos.y,
				widthPercent: state.viewCustomizations.back.textWidthPercent,
				heightPercent: state.viewCustomizations.back.textHeightPercent,
				angleDeg: state.viewCustomizations.back.textAngleDeg,
				color: state.viewCustomizations.back.textColor,
				font: state.viewCustomizations.back.textFont,
			};
			backView.textOverlays.push(textOverlay);
		}

		// Add image overlays
		backView.imageOverlays = state.viewCustomizations.back.imageOverlays.map(
			(img) => ({
				id: uuidv4(),
				url: img.url,
				x: img.x,
				y: img.y,
				widthPercent: img.widthPercent,
				heightPercent: img.heightPercent,
				angleDeg: img.angleDeg,
			})
		);

		views.push(backView);
	}

	return {
		productId: product.id,
		variantId: state.selectedVariantId || "",
		quantity: state.quantity,
		selectedColor: state.selectedColor || undefined,
		views,
		basePrice: pricing.basePrice,
		textPrice: pricing.textPrice,
		imagePrice: pricing.imagePrice,
		colorPrice: pricing.colorPrice,
		totalPrice: pricing.totalPrice,
		createdAt: now,
		updatedAt: now,
	};
}

/**
 * Generate a summary description of the customization for admin view
 */
export function generateCustomizationSummary(
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

/**
 * Calculate the canvas coordinates for rendering at 800x800 pixels
 */
export function convertPercentToPixels(
	percentX: number,
	percentY: number,
	percentWidth: number,
	percentHeight: number
) {
	return {
		x: (percentX / 100) * 800,
		y: (percentY / 100) * 800,
		width: (percentWidth / 100) * 800,
		height: (percentHeight / 100) * 800,
	};
}

/**
 * Validate customization data
 */
export function validateCustomization(customization: ProductCustomization): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!customization.productId) {
		errors.push("Product ID is required");
	}

	if (!customization.variantId) {
		errors.push("Variant ID is required");
	}

	if (customization.quantity < 1) {
		errors.push("Quantity must be at least 1");
	}

	if (customization.views.length === 0) {
		errors.push("At least one view with customizations is required");
	}

	// Validate text overlays
	customization.views.forEach((view, viewIndex) => {
		view.textOverlays.forEach((text, textIndex) => {
			if (!text.text.trim()) {
				errors.push(
					`Text overlay ${textIndex + 1} in ${view.view} view is empty`
				);
			}
			if (text.x < 0 || text.x > 100 || text.y < 0 || text.y > 100) {
				errors.push(
					`Text overlay ${textIndex + 1} in ${
						view.view
					} view has invalid position`
				);
			}
		});

		view.imageOverlays.forEach((image, imageIndex) => {
			if (!image.url) {
				errors.push(
					`Image overlay ${imageIndex + 1} in ${view.view} view has no URL`
				);
			}
			if (image.x < 0 || image.x > 100 || image.y < 0 || image.y > 100) {
				errors.push(
					`Image overlay ${imageIndex + 1} in ${
						view.view
					} view has invalid position`
				);
			}
		});
	});

	return {
		isValid: errors.length === 0,
		errors,
	};
}
