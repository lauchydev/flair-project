import { useState, useRef, useEffect } from "react";
import type { ViewPose } from "../types";

export interface ViewCustomization {
	text: string;
	textPos: { x: number; y: number };
	textColor: string;
	textFont: string;
	textWidthPercent: number;
	textHeightPercent: number;
	textAngleDeg: number;
	uploadedImage: string | null;
	uploadedImages: string[];
	imageOverlays: Array<{
		url: string;
		x: number;
		y: number;
		widthPercent: number;
		heightPercent: number;
		angleDeg: number;
	}>;
	activeImageIndex: number | null;
	imagePos: { x: number; y: number };
	imageWidthPercent: number;
	imageHeightPercent: number;
	imageAngleDeg: number;
}

export interface ViewCustomizations {
	front: ViewCustomization;
	back: ViewCustomization;
}

const createEmptyCustomization = (
	centerX: number,
	centerY: number
): ViewCustomization => ({
	text: "",
	textPos: { x: centerX, y: centerY },
	textColor: "#000000",
	textFont:
		"Inter, Merriweather, -apple-system, Segoe UI, Roboto-Slab, Graduate, Shrikhand, sans-serif",
	textWidthPercent: 40,
	textHeightPercent: 12,
	textAngleDeg: 0,
	uploadedImage: null,
	uploadedImages: [],
	imageOverlays: [],
	activeImageIndex: null,
	imagePos: { x: centerX, y: centerY },
	imageWidthPercent: 30,
	imageHeightPercent: 30,
	imageAngleDeg: 0,
});

export function useViewCustomizations(currentCenter: { x: number; y: number }) {
	const [selectedView, setSelectedView] = useState<ViewPose>("front");
	const [viewCustomizations, setViewCustomizations] =
		useState<ViewCustomizations>({
			front: createEmptyCustomization(currentCenter.x, currentCenter.y),
			back: createEmptyCustomization(currentCenter.x, currentCenter.y),
		});

	// Track presence for auto-centering
	const prevTextPresentRef = useRef<{ front: boolean; back: boolean }>({
		front: false,
		back: false,
	});
	const prevImagePresentRef = useRef<{ front: boolean; back: boolean }>({
		front: false,
		back: false,
	});

	// Auto-center text when it first appears
	useEffect(() => {
		const vc = viewCustomizations[selectedView];
		const hasText = !!vc.text;
		const hadText = prevTextPresentRef.current[selectedView];
		if (!hadText && hasText) {
			setViewCustomizations((prev) => ({
				...prev,
				[selectedView]: {
					...prev[selectedView],
					textPos: { x: currentCenter.x, y: currentCenter.y },
				},
			}));
		}
		prevTextPresentRef.current[selectedView] = hasText;
	}, [selectedView, viewCustomizations, currentCenter.x, currentCenter.y]);

	// Auto-center image when it first appears
	useEffect(() => {
		const vc = viewCustomizations[selectedView];
		const hasImg = !!vc.uploadedImage;
		const hadImg = prevImagePresentRef.current[selectedView];
		if (!hadImg && hasImg) {
			setViewCustomizations((prev) => ({
				...prev,
				[selectedView]: {
					...prev[selectedView],
					imagePos: { x: currentCenter.x, y: currentCenter.y },
				},
			}));
		}
		prevImagePresentRef.current[selectedView] = hasImg;
	}, [selectedView, viewCustomizations, currentCenter.x, currentCenter.y]);

	const currentViewCustomization = viewCustomizations[selectedView];

	// Derived values from current view
	const customText = currentViewCustomization.text;
	const textPos = currentViewCustomization.textPos;
	const textColor = currentViewCustomization.textColor;
	const textFont = currentViewCustomization.textFont;
	const textWidthPercent = currentViewCustomization.textWidthPercent;
	const textHeightPercent = currentViewCustomization.textHeightPercent;
	const textAngleDeg = currentViewCustomization.textAngleDeg;

	const activeImageUrl = currentViewCustomization.uploadedImage;
	const imagePos = currentViewCustomization.imagePos;
	const imageWidthPercent = currentViewCustomization.imageWidthPercent;
	const imageHeightPercent = currentViewCustomization.imageHeightPercent;
	const imageAngleDeg = currentViewCustomization.imageAngleDeg;

	// Other images for the overlay
	const otherImages = (currentViewCustomization.imageOverlays || [])
		.filter((_, idx) => idx !== currentViewCustomization.activeImageIndex)
		.map((overlay) => ({
			url: overlay.url,
			x: overlay.x,
			y: overlay.y,
			widthPercent: overlay.widthPercent,
			heightPercent: overlay.heightPercent,
			angleDeg: overlay.angleDeg,
		}));

	return {
		selectedView,
		setSelectedView,
		viewCustomizations,
		setViewCustomizations,
		currentViewCustomization,
		// Derived values
		customText,
		textPos,
		textColor,
		textFont,
		textWidthPercent,
		textHeightPercent,
		textAngleDeg,
		activeImageUrl,
		imagePos,
		imageWidthPercent,
		imageHeightPercent,
		imageAngleDeg,
		otherImages,
	};
}
