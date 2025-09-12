"use client";

import React from "react";
import QuantityStepper from "../controls/QuantityStepper";

interface PriceActionsBarProps {
	quantity: number;
	onQuantityChange: (qty: number) => void;
	onAddToCart: () => void;
	priceDisplay: React.ReactNode;
	isLoading?: boolean;
	disabled?: boolean;
}

export default function PriceActionsBar({
	quantity,
	onQuantityChange,
	onAddToCart,
	priceDisplay,
	isLoading = false,
	disabled = false,
}: PriceActionsBarProps) {
	return (
		<section>
			<div className="flex items-center gap-3 rounded-2xl border-4 border-black bg-white px-3 py-3 shadow-xl">
				<QuantityStepper value={quantity} onChange={onQuantityChange} />
				<button
					className={`flex-1 rounded-2xl border-3 border-black px-4 py-3 text-center font-black text-white shadow-xl transition-colors ${
						isLoading || disabled
							? "bg-gray-400 cursor-not-allowed"
							: "bg-blue-600 hover:bg-blue-500 cursor-pointer"
					}`}
					onClick={onAddToCart}
					disabled={isLoading || disabled}
				>
					{isLoading ? "Adding..." : "Add to cart"}
				</button>
				<div className="ml-auto w-max rounded-xl border-2 border-black bg-white px-4 py-2 text-right">
					<div className="text-xl font-black text-black">{priceDisplay}</div>
				</div>
			</div>
			<div className="mt-2 text-xs font-semibold text-gray-600">
				Prices are estimates. Final price updates as you customize.
			</div>
		</section>
	);
}
