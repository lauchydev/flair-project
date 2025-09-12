export interface TextOverlay {
	id: string;
	text: string;
	x: number; // Position X as percentage
	y: number; // Position Y as percentage
	widthPercent: number;
	heightPercent: number;
	angleDeg: number;
	color: string;
	font: string;
}

export interface ImageOverlay {
	id: string;
	url: string;
	x: number; // Position X as percentage
	y: number; // Position Y as percentage
	widthPercent: number;
	heightPercent: number;
	angleDeg: number;
}

export interface ViewCustomization {
	view: "front" | "back";
	textOverlays: TextOverlay[];
	imageOverlays: ImageOverlay[];
	backgroundColor?: string;
}

export interface ProductCustomization {
	productId: string;
	variantId: string;
	quantity: number;
	selectedColor?: string;
	views: ViewCustomization[];

	// Pricing breakdown
	basePrice: number;
	textPrice: number;
	imagePrice: number;
	colorPrice: number;
	totalPrice: number;

	// Metadata
	createdAt: string;
	updatedAt: string;
}

export interface CustomizationSession {
	id: string;
	customization: ProductCustomization;
	previewImageUrl?: string; // Generated preview image
}

export interface CartCustomAttributes {
	_customization_data: string; // Hidden serialized ProductCustomization
	Customization: string; // User-friendly customization summary
	_custom_price: string; // Hidden formatted price display
	_admin_data: string; // Hidden admin description
	_preview_image_url?: string; // Hidden preview image
	_custom_color?: string; // Hidden color data
	_has_customization: string;
}

// Helper type for converting current ProductCustomizer state
export interface CustomizerState {
	selectedColor: string | null;
	quantity: number;
	selectedView: "front" | "back";
	selectedVariantId: string | null;
	viewCustomizations: {
		front: {
			text: string;
			textPos: { x: number; y: number };
			textColor: string;
			textFont: string;
			textWidthPercent: number;
			textHeightPercent: number;
			textAngleDeg: number;
			imageOverlays: Array<{
				url: string;
				x: number;
				y: number;
				widthPercent: number;
				heightPercent: number;
				angleDeg: number;
			}>;
		};
		back: {
			text: string;
			textPos: { x: number; y: number };
			textColor: string;
			textFont: string;
			textWidthPercent: number;
			textHeightPercent: number;
			textAngleDeg: number;
			imageOverlays: Array<{
				url: string;
				x: number;
				y: number;
				widthPercent: number;
				heightPercent: number;
				angleDeg: number;
			}>;
		};
	};
}
