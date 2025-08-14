import Image from "next/image";
import Link from "next/link";
import { ShopifyProduct } from "@/types/api/shopify";

interface ProductCardProps {
  product: ShopifyProduct;
  className?: string;
}

export default function ProductCard({
  product,
  className = "",
}: ProductCardProps) {
  const {
    title,
    handle,
    description,
    availableForSale,
    priceRange,
    featuredImage,
    productType,
    vendor,
    totalInventory,
  } = product;

  const price = priceRange.minVariantPrice;
  const hasMultiplePrices =
    priceRange.minVariantPrice.amount !== priceRange.maxVariantPrice.amount;

  return (
    <div
      className={`group relative bg-white rounded-3xl overflow-hidden border-4 border-black shadow-xl hover:shadow-lg hover:scale-102 transition-all duration-200 ${className}`}
      style={{ willChange: "box-shadow, transform" }}
    >
      {/* Colorful Top Border */}
      <div className="h-2 bg-gradient-to-r from-lime-400 via-purple-500 to-pink-400"></div>

      {/* Product Image */}
      <div className="aspect-square bg-gradient-to-br from-lime-100 to-purple-100 relative overflow-hidden">
        {featuredImage ? (
          <Image
            src={featuredImage.url}
            alt={featuredImage.altText || title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ willChange: "transform" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-200 to-pink-200">
            <span className="text-purple-600 text-lg font-bold">
              🎨 No Image
            </span>
          </div>
        )}

        {/* Fun Decorative Elements - Subtle animations */}
        <div className="absolute top-2 left-2 text-2xl opacity-70 animate-pulse">
          ✨
        </div>
        <div className="absolute bottom-2 right-2 text-xl opacity-70 group-hover:animate-bounce">
          ⭐
        </div>

        {/* Availability Badge */}
        <div className="absolute top-3 right-3">
          <span
            className={`text-xs px-3 py-1 rounded-full font-black border-2 border-black shadow-lg ${
              availableForSale && totalInventory > 0
                ? "bg-lime-400 text-black"
                : "bg-red-400 text-white"
            }`}
          >
            {availableForSale && totalInventory > 0
              ? "✅ READY"
              : "❌ SOLD OUT"}
          </span>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-6 bg-white">
        {/* Title with Creative Styling */}
        <div className="mb-4">
          <h3 className="font-black text-xl text-black mb-1 line-clamp-2">
            {title}
          </h3>
          <div className="w-12 h-1 bg-gradient-to-r from-lime-400 to-purple-500 rounded-full"></div>
        </div>

        {/* Price with Fun Styling */}
        <div className="mb-4">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-2xl border-2 border-black shadow-lg transform -rotate-1 inline-block">
            <span className="text-xl font-black">
              {hasMultiplePrices ? "FROM " : ""}
              ${price.amount} {price.currencyCode}
            </span>
          </div>
          {hasMultiplePrices && (
            <span className="text-sm text-purple-600 font-bold ml-2 block mt-1">
              UP TO {priceRange.maxVariantPrice.amount}{" "}
              {priceRange.maxVariantPrice.currencyCode}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <div className="mb-4 bg-lime-50 p-3 rounded-2xl border-2 border-lime-200">
            <p className="text-gray-800 text-sm font-medium line-clamp-2">
              {description.substring(0, 120)}
              {description.length > 120 ? "..." : ""}
            </p>
          </div>
        )}

        {/* Product Details with Icons */}
        <div className="text-xs text-gray-700 mb-6 space-y-2 bg-purple-50 p-3 rounded-2xl">
          {productType && (
            <p className="flex items-center">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
              <span className="font-bold">Type:</span> {productType}
            </p>
          )}
          {vendor && (
            <p className="flex items-center">
              <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
              <span className="font-bold">Brand:</span> {vendor}
            </p>
          )}
          <p className="flex items-center">
            <span className="w-2 h-2 bg-lime-400 rounded-full mr-2"></span>
            <span className="font-bold">Stock:</span> {totalInventory} available
          </p>
        </div>

        {/* Creative Action Buttons */}
        <div className="flex gap-3">
          <Link
            href={`/products/${handle}`}
            className="bg-lime-400 text-black px-6 py-3 rounded-2xl border-4 border-black font-black text-sm flex-1 text-center hover:bg-lime-300 hover:scale-105 transition-all duration-150 shadow-lg"
          >
            🎨 CUSTOMISE
          </Link>
          <button
            onClick={() => {
              // TODO: Implement add to cart functionality
              console.log(`Adding ${title} to cart`);
            }}
            disabled={!availableForSale || totalInventory === 0}
            className="bg-black text-white px-6 py-3 rounded-2xl border-4 border-black font-black text-sm flex-1 hover:bg-gray-800 hover:scale-105 transition-all duration-150 shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed disabled:transform-none"
          >
            🛒 ADD TO CART
          </button>
        </div>
      </div>
    </div>
  );
}
