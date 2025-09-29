"use client";

import { useState, useEffect, useCallback } from "react";
import { shopify } from "@/lib/shopify/client";
import {
	ShopifyProduct,
	ShopifyProductsResponse,
	extractNodes,
} from "@/types/api/shopify";
import ProductCard from "./ProductCard";

interface ProductsGridProps {
	initialProducts?: ShopifyProduct[];
	limit?: number;
}

export default function ProductsGrid({
	initialProducts,
	limit = 20,
}: ProductsGridProps) {
	const [products, setProducts] = useState<ShopifyProduct[]>(
		initialProducts || []
	);
	const [loading, setLoading] = useState(!initialProducts);
	const [error, setError] = useState<string | null>(null);

	const fetchProducts = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const response = (await shopify.getProducts(
				limit
			)) as ShopifyProductsResponse;
			const productNodes = extractNodes(response.products);

			setProducts(productNodes);
		} catch (err) {
			console.error("Error fetching products:", err);
			setError(err instanceof Error ? err.message : "Failed to load products");
		} finally {
			setLoading(false);
		}
	}, [limit]);

	useEffect(() => {
		if (!initialProducts) {
			fetchProducts();
		}
	}, [initialProducts, fetchProducts]);

	const retryFetch = () => {
		fetchProducts();
	};

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center py-16">
				<div className="relative">
					<div className="w-20 h-20 bg-gradient-to-r from-lime-400 to-purple-500 rounded-full border-4 border-black shadow-xl">
						<div className="w-full h-full rounded-full bg-gradient-to-r from-lime-400 to-purple-500 animate-pulse"></div>
					</div>
					<div className="absolute inset-0 flex items-center justify-center text-2xl">
						🎨
					</div>
				</div>
				<div className="mt-8 bg-white rounded-3xl px-8 py-4 border-4 border-black shadow-xl">
					<p className="text-black font-black text-lg">
						Loading Creative Products...
					</p>
					<p className="text-purple-600 font-bold text-sm">
						✨ Preparing something amazing! ✨
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="max-w-md mx-auto mt-8">
				<div className="bg-red-100 border-4 border-black rounded-3xl p-8 text-center shadow-xl transform rotate-1">
					<div className="text-6xl mb-4">😵</div>
					<h3 className="text-2xl font-black text-black mb-4">
						Oops! Something Went Wrong
					</h3>
					<p className="text-red-800 font-bold mb-6">{error}</p>
					<button
						onClick={retryFetch}
						className="bg-lime-400 text-black px-8 py-3 rounded-2xl border-4 border-black font-black hover:bg-lime-300 hover:scale-105 transition-all duration-150 shadow-lg"
					>
						🔄 TRY AGAIN
					</button>
				</div>
			</div>
		);
	}

	if (products.length === 0) {
		return (
			<div className="text-center py-16">
				<div className="max-w-lg mx-auto">
					<div className="text-8xl mb-6 animate-bounce">🛍️</div>
					<div className="bg-yellow-300 rounded-3xl p-8 border-4 border-black shadow-xl transform -rotate-2 mb-6">
						<h3 className="text-3xl font-black text-black mb-4">
							No Products Yet!
						</h3>
						<p className="text-gray-800 font-bold text-lg">
							We&apos;re working on adding some amazing creative products for
							you!
						</p>
					</div>
					<button
						onClick={retryFetch}
						className="bg-purple-500 text-white px-8 py-4 rounded-2xl border-4 border-black font-black text-lg hover:bg-purple-400 hover:scale-105 transition-all duration-150 shadow-xl"
					>
						🔍 CHECK AGAIN
					</button>
				</div>
			</div>
		);
	}

	return (
		<div>
			{/* Creative Products Count */}
			<div className="mb-12 text-center">
				<div className="inline-block bg-white rounded-3xl px-8 py-4 border-4 border-black shadow-xl transform rotate-1 hover:scale-105 transition-transform duration-200">
					<span className="text-2xl font-black text-black">
						🎯{" "}
						{products.length === 1
							? "1 AMAZING PRODUCT"
							: `${products.length} AMAZING PRODUCTS`}{" "}
						FOUND!
					</span>
					<div className="flex justify-center mt-2 space-x-2">
						<div className="w-3 h-3 bg-lime-400 rounded-full animate-pulse"></div>
						<div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
						<div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse"></div>
					</div>
				</div>
			</div>

			{/* Products Grid with Subtle Layout */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
				{products.map((product, index) => (
					<div
						key={product.id}
						className="animate-fade-in-up"
						style={{
							animationDelay: `${index * 100}ms`,
							animationFillMode: "both",
						}}
					>
						<ProductCard product={product} />
					</div>
				))}
			</div>

			{/* Fun Footer Message */}
			<div className="mt-16 text-center">
				<div className="bg-gradient-to-r from-lime-400 via-purple-500 to-pink-400 rounded-3xl p-6 border-4 border-black shadow-xl max-w-2xl mx-auto transform -rotate-1 hover:scale-105 hover:rotate-0 transition-all duration-300">
					<h3 className="text-2xl font-black text-white mb-2">
						🌟 READY TO CREATE?
					</h3>
					<p className="text-white font-bold text-lg">
						Click &quot;CUSTOMISE&quot; on any product to start your creative
						journey!
					</p>
				</div>
			</div>
		</div>
	);
}
