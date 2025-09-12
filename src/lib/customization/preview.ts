import type { ProductCustomization } from "@/types/customization";
import { convertPercentToPixels } from "./utils";

export interface PreviewOptions {
	width?: number;
	height?: number;
	view?: "front" | "back";
	productImageUrl: string;
}

/**
 * Generate a preview canvas for customization
 */
export async function generatePreviewCanvas(
	customization: ProductCustomization,
	options: PreviewOptions
): Promise<HTMLCanvasElement> {
	const {
		width = 800,
		height = 800,
		view = "front",
		productImageUrl,
	} = options;

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;

	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("Failed to get 2D context");
	}

	// Load and draw the product image
	const productImage = await loadImage(productImageUrl);
	ctx.drawImage(productImage, 0, 0, width, height);

	// Find the view customization
	const viewCustomization = customization.views.find((v) => v.view === view);
	if (!viewCustomization) {
		return canvas;
	}

	// Draw text overlays
	for (const textOverlay of viewCustomization.textOverlays) {
		await drawTextOverlay(ctx, textOverlay, width, height);
	}

	// Draw image overlays
	for (const imageOverlay of viewCustomization.imageOverlays) {
		await drawImageOverlay(ctx, imageOverlay, width, height);
	}

	return canvas;
}

/**
 * Generate a preview data URL for customization
 */
export async function generatePreviewDataUrl(
	customization: ProductCustomization,
	options: PreviewOptions
): Promise<string> {
	const canvas = await generatePreviewCanvas(customization, options);
	return canvas.toDataURL("image/png");
}

/**
 * Load an image and return a promise
 */
function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();

		// Only set crossOrigin for external URLs, not for blob URLs
		if (!src.startsWith("blob:") && !src.startsWith("data:")) {
			img.crossOrigin = "anonymous";
		}

		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

/**
 * Draw a text overlay on the canvas
 */
async function drawTextOverlay(
	ctx: CanvasRenderingContext2D,
	textOverlay: any,
	canvasWidth: number,
	canvasHeight: number
): Promise<void> {
	const pixels = convertPercentToPixels(
		textOverlay.x - textOverlay.widthPercent / 2,
		textOverlay.y - textOverlay.heightPercent / 2,
		textOverlay.widthPercent,
		textOverlay.heightPercent
	);

	// Scale to canvas size
	const x = (pixels.x / 800) * canvasWidth;
	const y = (pixels.y / 800) * canvasHeight;
	const width = (pixels.width / 800) * canvasWidth;
	const height = (pixels.height / 800) * canvasHeight;

	ctx.save();

	// Move to center of text area and rotate
	ctx.translate(x + width / 2, y + height / 2);
	ctx.rotate((textOverlay.angleDeg * Math.PI) / 180);

	// Set font properties
	const fontSize = Math.min(height * 0.8, 48 * (canvasWidth / 800));
	ctx.font = `bold ${fontSize}px ${textOverlay.font}`;
	ctx.fillStyle = textOverlay.color;
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";

	// Draw text (handle line breaks)
	const lines = textOverlay.text.split("\n");
	const lineHeight = fontSize * 1.2;
	const totalHeight = lines.length * lineHeight;
	const startY = -totalHeight / 2 + fontSize / 2;

	lines.forEach((line: string, index: number) => {
		ctx.fillText(line, 0, startY + index * lineHeight);
	});

	ctx.restore();
}

/**
 * Draw an image overlay on the canvas
 */
async function drawImageOverlay(
	ctx: CanvasRenderingContext2D,
	imageOverlay: any,
	canvasWidth: number,
	canvasHeight: number
): Promise<void> {
	try {
		if (!imageOverlay.url) {
			return;
		}

		const image = await loadImage(imageOverlay.url);

		const pixels = convertPercentToPixels(
			imageOverlay.x - imageOverlay.widthPercent / 2,
			imageOverlay.y - imageOverlay.heightPercent / 2,
			imageOverlay.widthPercent,
			imageOverlay.heightPercent
		);

		// Scale to canvas size
		const x = (pixels.x / 800) * canvasWidth;
		const y = (pixels.y / 800) * canvasHeight;
		const width = (pixels.width / 800) * canvasWidth;
		const height = (pixels.height / 800) * canvasHeight;

		ctx.save();

		// Move to center of image area and rotate
		ctx.translate(x + width / 2, y + height / 2);
		ctx.rotate((imageOverlay.angleDeg * Math.PI) / 180);

		// Draw image centered
		ctx.drawImage(image, -width / 2, -height / 2, width, height);

		ctx.restore();
	} catch (error) {
		// Draw a placeholder rectangle on error
		const pixels = convertPercentToPixels(
			imageOverlay.x - imageOverlay.widthPercent / 2,
			imageOverlay.y - imageOverlay.heightPercent / 2,
			imageOverlay.widthPercent,
			imageOverlay.heightPercent
		);

		const x = (pixels.x / 800) * canvasWidth;
		const y = (pixels.y / 800) * canvasHeight;
		const width = (pixels.width / 800) * canvasWidth;
		const height = (pixels.height / 800) * canvasHeight;

		ctx.save();
		ctx.translate(x + width / 2, y + height / 2);
		ctx.rotate((imageOverlay.angleDeg * Math.PI) / 180);

		// Draw error placeholder
		ctx.fillStyle = "rgba(255, 200, 200, 0.8)";
		ctx.fillRect(-width / 2, -height / 2, width, height);
		ctx.strokeStyle = "#f00";
		ctx.lineWidth = 2;
		ctx.strokeRect(-width / 2, -height / 2, width, height);

		// Add "IMAGE ERROR" text
		ctx.fillStyle = "#f00";
		ctx.font = "12px Arial";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText("IMAGE", 0, -6);
		ctx.fillText("ERROR", 0, 6);

		ctx.restore();
	}
}

/**
 * Create a preview thumbnail for the admin panel
 */
export async function generateThumbnail(
	customization: ProductCustomization,
	productImageUrl: string,
	size: number = 200
): Promise<string> {
	const canvas = await generatePreviewCanvas(customization, {
		width: size,
		height: size,
		productImageUrl,
	});

	return canvas.toDataURL("image/jpeg", 0.8);
}

/**
 * Create a preview for order details
 */
export async function generateOrderPreview(
	customization: ProductCustomization,
	productImageUrl: string
): Promise<{ front?: string; back?: string }> {
	const previews: { front?: string; back?: string } = {};

	// Generate front view if it has customizations
	const frontView = customization.views.find((v) => v.view === "front");
	if (
		frontView &&
		(frontView.textOverlays.length > 0 || frontView.imageOverlays.length > 0)
	) {
		previews.front = await generatePreviewDataUrl(customization, {
			productImageUrl,
			view: "front",
		});
	}

	// Generate back view if it has customizations
	const backView = customization.views.find((v) => v.view === "back");
	if (
		backView &&
		(backView.textOverlays.length > 0 || backView.imageOverlays.length > 0)
	) {
		previews.back = await generatePreviewDataUrl(customization, {
			productImageUrl,
			view: "back",
		});
	}

	return previews;
}
