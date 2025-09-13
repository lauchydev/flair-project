"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ShoppingCartIcon, UserIcon } from "@heroicons/react/24/outline";
import LogoutButton from "@/components/layout/LogoutButton";
import { CartStorage, shopifyCart } from "@/lib/shopify/customization-cart";
import { cartEvents } from "@/lib/cart/events";

export default function Header() {
	const pathname = usePathname();
	const [cartItemCount, setCartItemCount] = useState(0);
	const showLogout =
		pathname?.startsWith("/products") || pathname?.startsWith("/adminpanel");

	// Load cart item count
	useEffect(() => {
		const loadCartCount = async () => {
			try {
				const cartId = CartStorage.getCartId();
				if (!cartId) {
					setCartItemCount(0);
					return;
				}

				const cart = await shopifyCart.getCart(cartId);
				const itemCount = cart.lines.edges.reduce(
					(total, { node }) => total + node.quantity,
					0
				);
				setCartItemCount(itemCount);
			} catch (error) {
				console.error("Failed to load cart count:", error);
				setCartItemCount(0);
			}
		};

		// Load initial count
		loadCartCount();

		// Listen for cart updates
		const handleCartUpdate = () => {
			loadCartCount();
		};

		cartEvents.addEventListener("cartUpdate", handleCartUpdate);

		return () => {
			cartEvents.removeEventListener("cartUpdate", handleCartUpdate);
		};
	}, []);

	// TODO: Give the header a bit of a design overhaul

	return (
		<header className="bg-white shadow-sm">
			<div className="container mx-auto px-4 py-4">
				<div className="flex items-center justify-between">
					<div className="text-xl font-bold text-black">
						<Link href="/">Flair</Link>
					</div>

					{/* Centered Navigation */}
					<nav className="hidden md:block absolute left-1/2 -translate-x-1/2">
						<ul className="flex gap-8">
							<li>
								<Link
									href="/"
									className={`text-gray-800 hover:text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-md font-medium ${
										pathname === "/" ? "bg-gray-100" : ""
									}`}
								>
									Home
								</Link>
							</li>
							<li>
								<Link
									href="/products"
									className={`text-gray-800 hover:text-gray-600 hover:bg-gray-200 px-3 py-2 rounded-md font-medium ${
										pathname === "/products" ? "bg-gray-100" : ""
									}`}
								>
									Products
								</Link>
							</li>
						</ul>
					</nav>

					{/* Auth Buttons */}
					<div className="flex gap-4 items-center">
						<Link href="/cart" aria-label="Cart" className="relative">
							<ShoppingCartIcon className="w-6 h-6 text-black" />
							{cartItemCount > 0 && (
								<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
									{cartItemCount > 9 ? "9+" : cartItemCount}
								</span>
							)}
						</Link>

						{showLogout ? (
							<LogoutButton />
						) : (
							<Link href="/login" aria-label="Login">
								<UserIcon className="w-6 h-6 text-black hover:text-gray-700" />
							</Link>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
