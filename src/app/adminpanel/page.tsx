"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusIcon, UserPlusIcon, TrashIcon } from "@heroicons/react/24/outline";


export default function AdminPanelPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

async function handleDelete(id: string) {
  if (!confirm("Are you sure you want to delete this product?")) return;

  try {
    const res = await fetch("/api/delete-product", {
      method: "POST",                            // ← change to POST
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (!res.ok) {
      // TEMP DEBUG: show the server message so we know the exact cause
      const err = await res.json().catch(() => ({}));
      console.error("Delete error:", res.status, err);
      throw new Error(err?.message || `Delete failed (${res.status})`);
    }

    setProducts(prev => prev.filter(p => p.id !== id));
  } catch (e: any) {
    alert(e.message || "Could not delete product");
    console.error(e);
  }
}


  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch("/api/get-products");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  return (
    <div className="p-6">
      {/* Header with Add Product button */}
      <div className="mb-4 flex items-center justify-between">
    <h1 className="text-2xl font-bold">Admin Panel</h1>

    <div className="flex items-center gap-2">
      {/* NEW: Create Account */}
      <Link
        href="/adminpanel/create-account"
        className="inline-flex items-center gap-2 bg-white border px-4 py-2 rounded hover:bg-gray-50"
      >
        <UserPlusIcon className="w-5 h-5" />
        <span>Create Account</span>
      </Link>

      {/* Existing: Add Product */}
      <Link
        href="/adminpanel/product/new"
        className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded"
      >
        <PlusIcon className="w-5 h-5" />
        <span>Add Product</span>
      </Link>
    </div>
</div>


      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-4">
          {products.map((product) => {
            const image = product.images?.edges?.[0]?.node?.src || null;
            const altText =
              product.images?.edges?.[0]?.node?.altText || product.title;

            return (
              <li
                key={product.id}
                className="p-4 border rounded flex items-center justify-between hover:bg-gray-50 transition cursor-pointer"
                onClick={() =>
                  router.push(`/adminpanel/product/${encodeURIComponent(product.id)}`)
                }
              >
                {/* Left side: image + details */}
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
                    <h2 className="font-semibold">{product.title}</h2>
                    <p className="text-sm text-gray-600">
                      {product.description || "No description"}
                    </p>
                  </div>
                </div>

                {/* Right side: trash bin (no functionality yet) */}
                <button
                  className="p-2 text-gray-500 hover:text-red-500 transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log("Delete product", product.id);
                    handleDelete(product. id);
                  }}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

