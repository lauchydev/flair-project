import { useMemo, useEffect, useState } from "react";
import type { ViewPose } from "../types";
import {
	parseDesignAreaMetafield,
	parseMetafieldBoolean,
	parseColorMetafield,
	parsePriceModifier,
} from "../../../../lib/customizer/metafields";
import { getAvailableViewsForProduct } from "../../../../lib/customizer/config";
import { useVariantOptions } from "../hooks/useVariantOptions";

interface DesignArea {
	x: number;
	y: number;
	width: number;
	height: number;
}

export function useProductConfiguration(product: any) {
	// Color selection state
	const [selectedColor, setSelectedColor] = useState<string | null>(null);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		null
	);

	// Design area (metafield-backed) and per-view centers
	const designAreaConfig = useMemo(() => {
		type Rect = { x: number; y: number; width: number; height: number };
		const isRect = (o: unknown): o is Rect => {
			if (!o || typeof o !== "object") return false;
			const r = o as Record<string, unknown>;
			return (
				typeof r.x === "number" &&
				typeof r.y === "number" &&
				typeof r.width === "number" &&
				typeof r.height === "number"
			);
		};
		/* Retrieve the design area from the product metafield in shopify */
		const parsed = parseDesignAreaMetafield(product.designArea?.value);
		/* Default Design Area when no area is defined */
		const fallback: Rect = { x: 224, y: 184, width: 352, height: 432 };
		if (!parsed) {
			return { front: fallback, back: fallback } as Record<ViewPose, Rect>;
		}
		if (isRect(parsed)) {
			const rect = parsed as Rect;
			return { front: rect, back: rect } as Record<ViewPose, Rect>;
		}
		const byViewUnknown = parsed as Record<string, unknown>;
		const pick = (k: string): Rect | undefined =>
			isRect(byViewUnknown[k]) ? (byViewUnknown[k] as Rect) : undefined;
		return {
			front: pick("front") || fallback,
			back: pick("back") || pick("front") || fallback,
		} as Record<ViewPose, Rect>;
	}, [product.designArea?.value]);

	// Convert pixel rects (800x800) to percent rects for rendering
	const designAreaPercent = useMemo(() => {
		const toPct = (v: number) => (v / 800) * 100;
		const pxToPct = (r: DesignArea) => ({
			x: toPct(r.x),
			y: toPct(r.y),
			width: toPct(r.width),
			height: toPct(r.height),
		});
		return {
			front: pxToPct(designAreaConfig.front),
			back: pxToPct(designAreaConfig.back),
		} as Record<ViewPose, DesignArea>;
	}, [designAreaConfig.front, designAreaConfig.back]);

	const areaCenters = useMemo(() => {
		return {
			front: {
				x: designAreaPercent.front.x + designAreaPercent.front.width / 2,
				y: designAreaPercent.front.y + designAreaPercent.front.height / 2,
			},
			back: {
				x: designAreaPercent.back.x + designAreaPercent.back.width / 2,
				y: designAreaPercent.back.y + designAreaPercent.back.height / 2,
			},
		} as Record<ViewPose, { x: number; y: number }>;
	}, [
		designAreaPercent.front.x,
		designAreaPercent.front.y,
		designAreaPercent.front.width,
		designAreaPercent.front.height,
		designAreaPercent.back.x,
		designAreaPercent.back.y,
		designAreaPercent.back.width,
		designAreaPercent.back.height,
	]);

	const availableViews: ViewPose[] = useMemo(
		() => getAvailableViewsForProduct(product),
		[product]
	);

	// Feature flags from product metafields
	const enableCustomColor = parseMetafieldBoolean(product.customColor?.value);
	const enableCustomImage = parseMetafieldBoolean(product.customImage?.value);
	const enableCustomText = parseMetafieldBoolean(product.customText?.value);

	// Parse available colors from metafield
	const availableColours = useMemo(
		() => parseColorMetafield(product.colorsList?.value),
		[product.colorsList?.value]
	);

	// Price modifiers
	const textPrice = useMemo(
		() => parsePriceModifier(product.customTextPrice?.value),
		[product.customTextPrice?.value]
	);

	const imagePrice = useMemo(
		() => parsePriceModifier(product.customImagePrice?.value),
		[product.customImagePrice?.value]
	);

	const colorPrice = useMemo(
		() => parsePriceModifier(product.customColorPrice?.value),
		[product.customColorPrice?.value]
	);

	// Set initial color if available
	useEffect(() => {
		if (availableColours.length === 0) {
			if (selectedColor !== null) setSelectedColor(null);
			return;
		}
		if (!selectedColor || !availableColours.includes(selectedColor)) {
			setSelectedColor(availableColours[0]);
		}
	}, [availableColours, selectedColor]);

	// Variant options
	const {
		optionNames,
		optionValues,
		selectedOptions,
		setSelectedOptions,
		selectedVariant,
		isOptionAvailable,
	} = useVariantOptions(product);

	useEffect(() => {
		setSelectedVariantId(selectedVariant?.id ?? null);
	}, [selectedVariant?.id, setSelectedVariantId]);

	return {
		// Design configuration
		designAreaConfig,
		designAreaPercent,
		areaCenters,
		availableViews,

		// Feature flags
		enableCustomColor,
		enableCustomImage,
		enableCustomText,

		// Color configuration
		selectedColor,
		setSelectedColor,
		availableColours,

		// Pricing
		textPrice,
		imagePrice,
		colorPrice,

		// Variant options
		optionNames,
		optionValues,
		selectedOptions,
		setSelectedOptions,
		selectedVariant,
		selectedVariantId,
		setSelectedVariantId,
		isOptionAvailable,
	};
}
