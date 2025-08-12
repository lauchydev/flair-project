"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

type Product = {
  id: string;
  title: string;
  description?: string | null;
  images?: { edges: { node: { url?: string | null; src?: string | null; altText?: string | null } }[] };
  variants?: { edges: { node: { id: string; title: string; price: string } }[] };
};

export default function ProductDetailsPage() {
  const params = useParams() as { id: string };
  const gid = decodeURIComponent(params.id); 

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gid) return;
    (async () => {
      try {
        const res = await fetch(`/api/get-product?id=${encodeURIComponent(gid)}`, {
          cache: "no-store", 
        });
        const data = (await res.json()) as Product | null;
        setProduct(data);
      } catch (err) {
        console.error("Failed to fetch product", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [gid]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!product) return <p className="p-6">Product not found</p>;

  const imageUrl =
    product.images?.edges?.[0]?.node?.url ||
    product.images?.edges?.[0]?.node?.src ||
    null;
  const imageAlt = product.images?.edges?.[0]?.node?.altText || product.title;

  return (
    <div className="p-6">
      {/* Back link */}
      <Link href="/adminpanel" className="mb-6 inline-flex items-center gap-2 text-gray-600 hover:text-black">
        <ArrowLeftIcon className="w-5 h-5" />
        Back to Products
      </Link>

      {/* Layout: image left, details right */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              className="w-full md:w-[420px] h-auto object-cover rounded-lg shadow"
            />
          ) : (
            <div className="w-full md:w-[420px] h-[420px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
              No Image Available
            </div>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
          <p className="text-gray-700 leading-relaxed">
            {product.description || "No description"}
          </p>

          {/* Variants */}
          {product.variants?.edges?.length ? (
            <div className="mt-6">
              <h2 className="font-semibold mb-2">Variants</h2>
              <ul className="space-y-1">
                {product.variants.edges.map(({ node }) => (
                  <li key={node.id} className="text-sm text-gray-600">
                    {node.title} — ${node.price}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
