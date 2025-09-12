import { useMemo } from "react";

interface UsePricingProps {
	basePrice: number;
	quantity: number;
	hasText: boolean;
	hasImage: boolean;
	currencyCode?: string;
}

export function usePricing({
	basePrice,
	quantity,
	hasText,
	hasImage,
	currencyCode = "AUD",
}: UsePricingProps) {
	// Price calculations
	const textPrice = useMemo(() => (hasText ? 5 : 0), [hasText]);
	const imagePrice = useMemo(() => (hasImage ? 10 : 0), [hasImage]);
	const customizationPrice = useMemo(
		() => textPrice + imagePrice,
		[textPrice, imagePrice]
	);
	const unitPrice = useMemo(
		() => basePrice + customizationPrice,
		[basePrice, customizationPrice]
	);
	const totalPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

	// Format price function
	const formatPrice = (amount: number) =>
		`$${amount.toFixed(2)} ${currencyCode}`;

	// Formatted price displays
	const formattedUnitPrice = formatPrice(unitPrice);
	const formattedTotalPrice = formatPrice(totalPrice);

	return {
		textPrice,
		imagePrice,
		customizationPrice,
		unitPrice,
		totalPrice,
		formattedUnitPrice,
		formattedTotalPrice,
		formatPrice,
	};
}
