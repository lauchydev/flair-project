"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
    ShoppingCartIcon,
    UserIcon,
    Bars3Icon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import LogoutButton from "@/components/layout/LogoutButton";
import { CartStorage, shopifyCart } from "@/lib/shopify/customization-cart";
import { cartEvents } from "@/lib/cart/events";
import { useUser } from "@/components/UserContext";

export default function Header() {
    const pathname = usePathname();
    const [cartItemCount, setCartItemCount] = useState(0);
    const { user } = useUser();
    const isLoggedIn = Boolean(user);
    const showLogout =
        isLoggedIn &&
        (pathname?.startsWith("/products") ||
            pathname?.startsWith("/adminpanel"));
    const [mobileOpen, setMobileOpen] = useState(false);

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

    return (
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-black/10">
            <div className="container mx-auto px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Left: Brand */}
                    <Link href="/" className="inline-flex items-center">
                        <div className="bg-white border-4 border-black px-4 py-1 -rotate-2 shadow-sm">
                            <span className="text-2xl font-black tracking-tight">
                                FLAIR
                            </span>
                        </div>
                    </Link>

                    {/* Center: Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        <NavLink
                            href="/"
                            label="Home"
                            active={pathname === "/"}
                        />
                        <NavLink
                            href="/products"
                            label="Products"
                            active={pathname?.startsWith("/products") ?? false}
                        />
                    </nav>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/cart"
                            aria-label="Cart"
                            className="relative inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-2.5 py-2 hover:bg-gray-50 transition-colors"
                        >
                            <ShoppingCartIcon className="w-6 h-6 text-gray-900" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[1.25rem] h-5 px-1 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                                    {cartItemCount > 9 ? "9+" : cartItemCount}
                                </span>
                            )}
                        </Link>

                        {showLogout ? (
                            <LogoutButton className="hidden md:inline-flex px-3 py-2 rounded-lg border border-black/10 bg-white hover:bg-gray-50 text-sm font-semibold" />
                        ) : (
                            <Link
                                href="/login"
                                aria-label="Login"
                                className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-black/10 bg-white hover:bg-gray-50 text-sm font-semibold"
                            >
                                <UserIcon className="w-5 h-5" />
                                Login
                            </Link>
                        )}

                        {/* Mobile menu button */}
                        <button
                            className="md:hidden inline-flex items-center justify-center rounded-lg border border-black/10 bg-white p-2 hover:bg-gray-50"
                            aria-controls="mobile-menu"
                            aria-expanded={mobileOpen}
                            onClick={() => setMobileOpen((v) => !v)}
                        >
                            {mobileOpen ? (
                                <XMarkIcon className="h-6 w-6" />
                            ) : (
                                <Bars3Icon className="h-6 w-6" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {mobileOpen && (
                    <nav id="mobile-menu" className="md:hidden pb-4">
                        <ul className="flex flex-col gap-2">
                            <li>
                                <Link
                                    href="/"
                                    onClick={() => setMobileOpen(false)}
                                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        pathname === "/"
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-900 hover:bg-gray-100"
                                    }`}
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/products"
                                    onClick={() => setMobileOpen(false)}
                                    className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                                        pathname?.startsWith("/products")
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-900 hover:bg-gray-100"
                                    }`}
                                >
                                    Products
                                </Link>
                            </li>
                            <li className="pt-1 border-t border-black/10 mt-1">
                                {showLogout ? (
                                    <LogoutButton className="w-full text-left px-3 py-2 rounded-md text-sm font-semibold hover:bg-gray-100" />
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="block px-3 py-2 rounded-md text-sm font-semibold hover:bg-gray-100"
                                    >
                                        Login
                                    </Link>
                                )}
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </header>
    );
}

type NavLinkProps = {
    href: string;
    label: string;
    active?: boolean;
};

function NavLink({ href, label, active }: NavLinkProps) {
    return (
        <Link
            href={href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                    ? "bg-gray-900 text-white"
                    : "text-gray-900 hover:bg-gray-100"
            }`}
        >
            {label}
        </Link>
    );
}
