"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useUser } from "../../components/UserContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    TrashIcon,
    PlusIcon,
    UserPlusIcon,
    ArrowLeftIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    UserCircleIcon,
} from "@heroicons/react/24/outline";

import LogoutButton from "@/components/layout/LogoutButton";

type ImageNode = {
    id?: string | null;
    url?: string | null;
    src?: string | null;
    altText?: string | null;
};

type Product = {
    id: string;
    title: string;
    images?: { edges: { node: ImageNode }[] };
    metafields?: {
        namespace: string;
        key: string;
        value: string;
        type: string;
    }[];
    productOwner?: string;
};

export default function AdminPanelPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const router = useRouter();
    const { user } = useUser();
    const currentUser = user?.email || "";
    const currentUserRole = user?.role || "";
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function loadProducts() {
            try {
                const res = await fetch("/api/get-products", {
                    cache: "no-store",
                });
                const data = await res.json();
                const productsWithOwner = (data || []).map((p: any) => ({
                    ...p,
                    productOwner: p.productOwner?.value || "",
                }));
                setProducts(productsWithOwner);
            } catch (err) {
                console.error("Failed to fetch products", err);
                if (!cancelled) setProducts([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        loadProducts();
        return () => {
            cancelled = true;
        };
    }, []);

    async function onDeleteProduct(e: React.MouseEvent, product: Product) {
        e.stopPropagation();
        const ok = window.confirm(
            `Are you sure you want to delete “${product.title}”? This cannot be undone.`
        );
        if (!ok) return;

        try {
            setDeletingId(product.id);
            const res = await fetch("/api/delete-product", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: product.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                alert(data?.error || "Failed to delete product");
                return;
            }
            setProducts((prev) => prev.filter((p) => p.id !== product.id));
        } catch (err: any) {
            alert(err?.message || "Network error");
        } finally {
            setDeletingId(null);
        }
    }

    useEffect(() => {
        if (isSearchOpen) {
            const t = setTimeout(() => searchInputRef.current?.focus(), 50);
            return () => clearTimeout(t);
        }
    }, [isSearchOpen]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        const ownedProducts = products.filter(
            (p) => p.productOwner === currentUser
        );
        if (currentUserRole === "admin") {
            if (!q) return products;
            return products.filter((p) => p.title?.toLowerCase().includes(q));
        } else {
            if (!q) return ownedProducts;
            return ownedProducts.filter((p) =>
                p.title?.toLowerCase().includes(q)
            );
        }
    }, [products, query, currentUser, currentUserRole]);

    const Grid = useMemo(() => {
        if (loading) {
            return (
                <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <li
                            key={`skeleton-${i}`}
                            className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm overflow-hidden"
                        >
                            <div className="aspect-square animate-pulse bg-stone-200" />
                            <div className="p-2.5">
                                <div className="h-3.5 w-3/4 animate-pulse rounded bg-stone-200" />
                            </div>
                        </li>
                    ))}
                </ul>
            );
        }

        if (!filtered.length) {
            return (
                <div className="rounded-xl border border-stone-200 bg-stone-50 shadow-sm p-10 text-center">
                    <p className="text-stone-700">
                        {query ? "No matching products." : "No products yet."}
                    </p>
                </div>
            );
        }

        return (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
                {filtered.map((product) => {
                    const imgNode = product.images?.edges?.[0]?.node;
                    const image = imgNode?.src || imgNode?.url || null;
                    const altText =
                        imgNode?.altText || product.title || "Product";

                    return (
                        <li
                            key={product.id}
                            className="group relative rounded-xl border border-stone-200 bg-stone-50 shadow-sm ring-1 ring-black/5 overflow-hidden transition hover:shadow-md cursor-pointer"
                            onClick={() =>
                                router.push(
                                    `/adminpanel/product/${encodeURIComponent(
                                        product.id
                                    )}`
                                )
                            }
                        >
                            {image ? (
                                <img
                                    src={image}
                                    alt={altText}
                                    className="aspect-square w-full object-cover transition group-hover:scale-[1.01]"
                                />
                            ) : (
                                <div className="aspect-square w-full bg-stone-200 flex items-center justify-center text-stone-400 text-xs">
                                    No Image
                                </div>
                            )}

                            <div className="p-2.5">
                                <h2 className="line-clamp-2 text-[13px] font-medium text-stone-900">
                                    {product.title || "Untitled"}
                                </h2>
                                <p className="text-[11px] text-stone-500 mt-1">
                                    Designer:{" "}
                                    {!product.productOwner ||
                                    product.productOwner === "None@Set.test"
                                        ? "None"
                                        : product.productOwner}
                                </p>
                            </div>

                            <button
                                className="absolute right-2 top-2 rounded-full bg-stone-50/90 p-1.5 backdrop-blur ring-1 ring-black/10 opacity-0 transition group-hover:opacity-100 hover:bg-stone-100 disabled:opacity-60"
                                onClick={(e) => onDeleteProduct(e, product)}
                                aria-label="Delete product"
                                disabled={deletingId === product.id}
                            >
                                <TrashIcon className="h-4 w-4 text-stone-600 hover:text-rose-500" />
                            </button>
                        </li>
                    );
                })}
            </ul>
        );
    }, [loading, filtered, query, router]);

    return (
        <div className="min-h-screen bg-stone-100">
            {/* Floating header */}
            <div className="sticky top-0 z-20 px-4 sm:px-6 py-3">
                <div className="relative rounded-2xl border border-stone-200 bg-stone-50/90 backdrop-blur shadow-md">
                    {/* Exit (left) */}
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-stone-700 hover:text-stone-900"
                        >
                            <ArrowLeftIcon className="h-5 w-5" />
                            <span className="hidden sm:inline">Exit</span>
                        </Link>
                    </div>

                    {/* Title */}
                    <div className="py-2.5 text-center">
                        <h1 className="text-lg font-semibold tracking-tight text-stone-800">
                            Admin Panel
                        </h1>
                        <p className="text-[11px] text-stone-500">
                            Manage your products
                        </p>
                    </div>

                    {/* Actions (right) */}
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-4">
                        {/* Add Product */}
                        <Link
                            href="/adminpanel/product/new"
                            className="group inline-flex items-center text-stone-700 hover:text-indigo-600 transition"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span className="ml-1 max-w-0 opacity-0 transition-all duration-200 ease-out group-hover:max-w-[140px] group-hover:opacity-100 whitespace-nowrap text-sm">
                                Add Product
                            </span>
                        </Link>

                        {/* Add User */}
                        <Link
                            href="/adminpanel/create-user"
                            className="group inline-flex items-center text-stone-700 hover:text-indigo-600 transition"
                            aria-label="Add User"
                        >
                            <UserPlusIcon className="h-5 w-5" />
                            <span className="ml-1 max-w-0 opacity-0 transition-all duration-200 ease-out group-hover:max-w-[120px] group-hover:opacity-100 whitespace-nowrap text-sm">
                                Add User
                            </span>
                        </Link>

                        {/* Search */}
                        {!isSearchOpen ? (
                            <button
                                type="button"
                                onClick={() => setIsSearchOpen(true)}
                                className="text-stone-700 hover:text-indigo-600 transition"
                                aria-label="Search"
                            >
                                <MagnifyingGlassIcon className="h-5 w-5" />
                            </button>
                        ) : (
                            <div className="flex items-center border-b border-stone-300">
                                <MagnifyingGlassIcon className="h-5 w-5 text-stone-500" />
                                <input
                                    ref={searchInputRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search..."
                                    className="ml-2 bg-transparent outline-none placeholder-stone-400 text-sm w-40 sm:w-56"
                                    onKeyDown={(e) => {
                                        if (e.key === "Escape") {
                                            setIsSearchOpen(false);
                                            setQuery("");
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setQuery("");
                                    }}
                                    className="ml-1 text-stone-500 hover:text-stone-700"
                                    aria-label="Close search"
                                >
                                    <XMarkIcon className="h-5 w-5" />
                                </button>
                            </div>
                        )}
                        {/* Username*/}
                        {user?.email && (
                            <span
                                className="flex items-center text-stone-700 text-sm mr-2"
                                title={user.email}
                            >
                                <UserCircleIcon className="w-5 h-5 mr-1 text-stone-500" />
                                {user.email}
                            </span>
                        )}
                        {/* Visible Logout button */}
                        <LogoutButton />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 pb-10">{Grid}</div>
        </div>
    );
}
