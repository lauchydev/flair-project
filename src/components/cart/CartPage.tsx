"use client";

import { useEffect, useState } from "react";
import {
	shopifyCart,
	CartStorage,
	type Cart,
	type CartItem,
} from "@/lib/shopify/customization-cart";
import type { ProductCustomization } from "@/types/customization";
import { generateThumbnail } from "@/lib/customization/preview";
import LoadingSpinner from "@/components/ui/loading/LoadingSpinner";
import { cartEvents } from "@/lib/cart/events";

export default function CartPage() {
	const [cart, setCart] = useState<Cart | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [previews, setPreviews] = useState<Record<string, string>>({});

	// Load cart on component mount
	useEffect(() => {
		loadCart();
	}, []);

	const loadCart = async () => {
		try {
			setLoading(true);
			setError(null);

			const cartId = CartStorage.getCartId();
			if (!cartId) {
				setCart(null);
				return;
			}

			const cartData = await shopifyCart.getCart(cartId);
			setCart(cartData);

			// Generate previews for customized items
			await generatePreviews(cartData);
		} catch (err) {
			console.error("Failed to load cart:", err);
			setError("Failed to load cart");
		} finally {
			setLoading(false);
		}
	};

	const generatePreviews = async (cartData: Cart) => {
		const previewPromises = cartData.lines.edges.map(async ({ node }) => {
			if (!shopifyCart.hasCustomization(node)) return null;

			const customization = shopifyCart.getCustomizationFromCartItem(node);
			if (!customization) return null;

			try {
				const productImageUrl = node.merchandise.product.featuredImage?.url;
				if (!productImageUrl) return null;

				const preview = await generateThumbnail(
					customization,
					productImageUrl,
					150
				);
				return { itemId: node.id, preview };
			} catch (error) {
				console.error("Failed to generate preview for item:", node.id, error);
				return null;
			}
		});

		const results = await Promise.all(previewPromises);
		const previewMap: Record<string, string> = {};

		results.forEach((result) => {
			if (result) {
				previewMap[result.itemId] = result.preview;
			}
		});

		setPreviews(previewMap);
	};

	const getCustomizationSummary = (item: CartItem) => {
		const customizationSummary = item.attributes.find(
			(attr) => attr.key === "Customization"
		);
		return customizationSummary?.value || "Custom product";
	};

	const handleRemoveItem = async (itemId: string) => {
		if (!cart) return;

		try {
			setLoading(true);
			const cartId = CartStorage.getCartId();
			if (!cartId) return;

			const updatedCart = await shopifyCart.removeFromCart(cartId, itemId);
			setCart(updatedCart);

			// Emit cart update event for header
			cartEvents.emitCartUpdate();

			// Regenerate previews for remaining items
			await generatePreviews(updatedCart);
		} catch (error) {
			console.error("Failed to remove item:", error);
			setError("Failed to remove item from cart");
		} finally {
			setLoading(false);
		}
	};

	const getTotalPrice = () => {
		if (!cart) return "$0.00";
		return `$${cart.cost.totalAmount.amount} ${cart.cost.totalAmount.currencyCode}`;
	};

	const handleCheckout = () => {
		if (cart?.checkoutUrl) {
			window.location.href = cart.checkoutUrl;
		}
	};

	if (loading) {
		return (
			<div className="bg-gradient-to-b from-yellow-50 to-purple-50 py-10 min-h-screen">
				<div className="container mx-auto px-4">
					<div className="text-center">
						<LoadingSpinner />
						<p className="mt-4 text-gray-600">Loading your cart...</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-gradient-to-b from-yellow-50 to-purple-50 py-10 min-h-screen">
				<div className="container mx-auto px-4">
					<div className="rounded-3xl border-4 border-red-500 bg-white p-10 text-center shadow-xl">
						<h1 className="text-3xl font-black text-red-600 mb-4">Error</h1>
						<p className="text-gray-700 font-semibold">{error}</p>
						<button
							onClick={loadCart}
							className="mt-4 rounded-2xl border-2 border-black bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-500"
						>
							Try Again
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!cart || cart.lines.edges.length === 0) {
		return (
			<div className="bg-gradient-to-b from-yellow-50 to-purple-50 py-10 min-h-screen">
				<div className="container mx-auto px-4">
					<div className="rounded-3xl border-4 border-black bg-white p-10 text-center shadow-xl">
						<h1 className="text-3xl font-black text-black mb-4">
							Your Cart is Empty
						</h1>
						<p className="text-gray-700 font-semibold mb-6">
							Add some customized products to get started!
						</p>
						<a
							href="/products"
							className="rounded-2xl border-2 border-black bg-blue-600 px-6 py-3 font-black text-white hover:bg-blue-500 inline-block"
						>
							Shop Products
						</a>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-gradient-to-b from-yellow-50 to-purple-50 py-10 min-h-screen">
			<div className="container mx-auto px-4">
				{/* Header */}
				<div className="mb-6">
					<h1 className="text-3xl font-black text-black mb-2">Your Cart</h1>
					<p className="text-gray-700 font-semibold">
						Review your customized products before checkout
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Cart Items */}
					<div className="lg:col-span-2 space-y-4">
						{cart.lines.edges.map(({ node: item }) => (
							<div
								key={item.id}
								className="rounded-3xl border-4 border-black bg-white p-6 shadow-xl"
							>
								<div className="flex gap-4">
									{/* Product Image or Preview */}
									<div className="flex-shrink-0">
										{previews[item.id] ? (
											<img
												src={previews[item.id]}
												alt="Custom preview"
												className="w-24 h-24 rounded-xl border-2 border-black object-cover"
											/>
										) : (
											<img
												src={
													item.merchandise.product.featuredImage?.url ||
													"/placeholder.png"
												}
												alt={item.merchandise.product.title}
												className="w-24 h-24 rounded-xl border-2 border-black object-cover"
											/>
										)}
									</div>

									{/* Product Details */}
									<div className="flex-grow">
										<h3 className="text-lg font-black text-black mb-1">
											{item.merchandise.product.title}
										</h3>

										{/* Variant Options - Hide Default Title */}
										{item.merchandise.selectedOptions
											.filter((option) => option.value !== "Default Title")
											.map((option) => (
												<p key={option.name} className="text-sm text-gray-600">
													{option.name}:{" "}
													<span className="font-semibold">{option.value}</span>
												</p>
											))}

										{/* Customization Summary */}
										{shopifyCart.hasCustomization(item) && (
											<div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
												<p className="text-xs font-semibold text-blue-800 mb-1">
													Customization:
												</p>
												<div className="text-xs text-blue-700 whitespace-pre-line">
													{getCustomizationSummary(item)}
												</div>
											</div>
										)}

										{/* Quantity, Price, and Remove Button */}
										<div className="mt-3 flex items-center justify-between">
											<div className="flex items-center gap-4">
												<p className="text-sm text-gray-600">
													Quantity:{" "}
													<span className="font-semibold">{item.quantity}</span>
												</p>
												<button
													onClick={() => handleRemoveItem(item.id)}
													className="text-xs bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-500 font-semibold border-3 border-black cursor-pointer"
													disabled={loading}
												>
													Remove
												</button>
											</div>
											<p className="text-lg font-black text-black">
												${item.cost.totalAmount.amount}{" "}
												{item.cost.totalAmount.currencyCode}
											</p>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>

					{/* Cart Summary */}
					<div className="lg:col-span-1">
						<div className="rounded-3xl border-4 border-black bg-white p-6 shadow-xl sticky top-6">
							<h2 className="text-xl font-black text-black mb-4">
								Order Summary
							</h2>

							<div className="space-y-3 mb-6">
								<div className="flex justify-between">
									<span className="text-gray-600">Subtotal:</span>
									<span className="font-semibold">
										${cart.cost.subtotalAmount.amount}{" "}
										{cart.cost.subtotalAmount.currencyCode}
									</span>
								</div>
								<div className="flex justify-between text-lg font-black">
									<span>Total:</span>
									<span>{getTotalPrice()}</span>
								</div>
							</div>

							<button
								onClick={handleCheckout}
								className="w-full rounded-2xl border-4 border-black bg-green-600 px-6 py-4 font-black text-white hover:bg-green-500 transition-colors shadow-xl cursor-pointer"
							>
								Proceed to Checkout
							</button>

							<p className="mt-3 text-xs text-gray-600 text-center">
								You'll be redirected to Shopify's secure checkout
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
