import { NextRequest, NextResponse } from "next/server";
import type { ProductCustomization } from "@/types/customization";
import { convertPercentToPixels } from "@/lib/customization/utils";
import { createCanvas, loadImage, Canvas } from "canvas";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { customization, productImageUrl } = body as {
			customization: ProductCustomization;
			productImageUrl: string;
		};

		if (!customization || !productImageUrl) {
			return NextResponse.json(
				{ error: "Missing customization data or product image URL" },
				{ status: 400 }
			);
		}

		// Generate preview image URL (we'll implement the actual generation)
		const previewImageUrl = await generateCustomizationPreview(
			customization,
			productImageUrl
		);

		return NextResponse.json({ previewImageUrl });
	} catch (error) {
		console.error("Error generating customization preview:", error);
		return NextResponse.json(
			{ error: "Failed to generate preview image" },
			{ status: 500 }
		);
	}
}

async function generateCustomizationPreview(
	customization: ProductCustomization,
	productImageUrl: string
): Promise<string> {
	// Create a 800x800 canvas for the preview
	const canvas = createCanvas(800, 800);
	const ctx = canvas.getContext('2d');

	try {
		// Load and draw the product image
		const productImage = await loadImage(productImageUrl);
		ctx.drawImage(productImage, 0, 0, 800, 800);

		// Only render the front view for preview
		const frontView = customization.views.find(view => view.view === 'front');
		if (!frontView) {
			// If no front view, return the product image
			return canvas.toDataURL('image/png');
		}

		// Render text overlays
		for (const textOverlay of frontView.textOverlays) {
			await renderTextOverlay(ctx, textOverlay);
		}

		// Render image overlays
		for (const imageOverlay of frontView.imageOverlays) {
			await renderImageOverlay(ctx, imageOverlay);
		}

		// Return as base64 data URL
		return canvas.toDataURL('image/png');
	} catch (error) {
		// Return a simple colored canvas as fallback
		ctx.fillStyle = '#f0f0f0';
		ctx.fillRect(0, 0, 800, 800);
		ctx.fillStyle = '#666';
		ctx.font = '24px Arial';
		ctx.textAlign = 'center';
		ctx.fillText('Preview unavailable', 400, 400);
		return canvas.toDataURL('image/png');
	}
}

async function renderTextOverlay(ctx: any, textOverlay: any) {
	const pixels = convertPercentToPixels(
		textOverlay.x - textOverlay.widthPercent / 2,
		textOverlay.y - textOverlay.heightPercent / 2,
		textOverlay.widthPercent,
		textOverlay.heightPercent
	);

	// Save the current context
	ctx.save();

	// Move to the center of the text area for rotation
	const centerX = pixels.x + pixels.width / 2;
	const centerY = pixels.y + pixels.height / 2;
	ctx.translate(centerX, centerY);
	ctx.rotate((textOverlay.angleDeg * Math.PI) / 180);

	// Set text properties
	const fontSize = Math.min(pixels.height * 0.8, 48);
	ctx.font = `bold ${fontSize}px ${textOverlay.font || 'Arial'}`;
	ctx.fillStyle = textOverlay.color;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// Draw the text
	ctx.fillText(textOverlay.text, 0, 0);

	// Restore the context
	ctx.restore();
}

async function renderImageOverlay(ctx: any, imageOverlay: any) {
	try {
		const pixels = convertPercentToPixels(
			imageOverlay.x - imageOverlay.widthPercent / 2,
			imageOverlay.y - imageOverlay.heightPercent / 2,
			imageOverlay.widthPercent,
			imageOverlay.heightPercent
		);

		// Validate the image URL
		if (!imageOverlay.url) {
			return;
		}

		// Check if this is a blob URL (not accessible from server)
		if (imageOverlay.url.startsWith('blob:')) {
			// Draw a placeholder rectangle
			ctx.save();
			const centerX = pixels.x + pixels.width / 2;
			const centerY = pixels.y + pixels.height / 2;
			ctx.translate(centerX, centerY);
			ctx.rotate((imageOverlay.angleDeg * Math.PI) / 180);
			
			ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
			ctx.fillRect(-pixels.width / 2, -pixels.height / 2, pixels.width, pixels.height);
			ctx.strokeStyle = '#999';
			ctx.lineWidth = 2;
			ctx.strokeRect(-pixels.width / 2, -pixels.height / 2, pixels.width, pixels.height);
			
			// Add "IMAGE" text
			ctx.fillStyle = '#666';
			ctx.font = '14px Arial';
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText('IMAGE', 0, 0);
			
			ctx.restore();
			return;
		}

		// Load the overlay image
		const overlayImage = await loadImage(imageOverlay.url);

		// Save the current context
		ctx.save();

		// Move to the center of the image area for rotation
		const centerX = pixels.x + pixels.width / 2;
		const centerY = pixels.y + pixels.height / 2;
		ctx.translate(centerX, centerY);
		ctx.rotate((imageOverlay.angleDeg * Math.PI) / 180);

		// Draw the image centered
		ctx.drawImage(
			overlayImage,
			-pixels.width / 2,
			-pixels.height / 2,
			pixels.width,
			pixels.height
		);

		// Restore the context
		ctx.restore();
	} catch (error) {
		// Draw a placeholder rectangle on error
		ctx.save();
		const pixels = convertPercentToPixels(
			imageOverlay.x - imageOverlay.widthPercent / 2,
			imageOverlay.y - imageOverlay.heightPercent / 2,
			imageOverlay.widthPercent,
			imageOverlay.heightPercent
		);
		const centerX = pixels.x + pixels.width / 2;
		const centerY = pixels.y + pixels.height / 2;
		ctx.translate(centerX, centerY);
		ctx.rotate((imageOverlay.angleDeg * Math.PI) / 180);
		
		ctx.fillStyle = 'rgba(255, 200, 200, 0.5)';
		ctx.fillRect(-pixels.width / 2, -pixels.height / 2, pixels.width, pixels.height);
		ctx.strokeStyle = '#f00';
		ctx.lineWidth = 2;
		ctx.strokeRect(-pixels.width / 2, -pixels.height / 2, pixels.width, pixels.height);
		
		// Add "ERROR" text
		ctx.fillStyle = '#f00';
		ctx.font = '12px Arial';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText('ERROR', 0, 0);
		
		ctx.restore();
	}
}


