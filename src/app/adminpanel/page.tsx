"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrashIcon, PlusIcon } from "@heroicons/react/24/outline";

// If your tsconfig has "@/components" path alias, keep this import.
// Otherwise change to a relative path like: "../../components/layout/LogoutButton"
import LogoutButton from "@/components/layout/LogoutButton";


type Product = {
  id: string;
  title?: string;
  description?: string;
  images?: {
    edges?: { node?: { src?: string; altText?: string } }[];
  };
};

export default function AdminPanelPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        // Avoid cached HTML/data while developing
        const res = await fetch("/api/get-products", { cache: "no-store" });
        const data = await res.json();

        const list: Product[] =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.products)
            ? data.products
            : [];

        if (!cancelled) setProducts(list);
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

  return (
    <div className="p-6">
      {/* Header row */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>

        <div className="flex items-center gap-3">
          <Link
            href="/adminpanel/product/new"
            className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:opacity-90"
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Product</span>
          </Link>

          {/* Visible Logout button here */}
          <LogoutButton />
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : products.length > 0 ? (
        <ul className="space-y-4">
          {products.map((product) => {
            const image = product?.images?.edges?.[0]?.node?.src || null;
            const altText =
              product?.images?.edges?.[0]?.node?.altText ||
              product?.title ||
              "Product";

            return (
              <li
                key={product.id}
                className="p-4 border rounded flex items-center justify-between hover:bg-gray-50 transition cursor-pointer"
                onClick={() =>
                  router.push(
                    `/adminpanel/product/${encodeURIComponent(product.id)}`
                  )
                }
              >
                {/* Left: image + details */}
                <div className="flex items-center gap-4">
                  {image ? (
                    <img
                      src={image}
                      alt={altText}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}

                  <div>
                    <h2 className="font-semibold">{product.title || "Untitled"}</h2>
                    <p className="text-sm text-gray-600">
                      {product.description || "No description"}
                    </p>
                  </div>
                </div>

                {/* Right: placeholder delete (no-op) */}
                <button
                  className="p-2 text-gray-500 hover:text-red-500 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Delete product", product.id);
                  }}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-gray-600">No products found.</p>
      )}
    </div>
  );
}
