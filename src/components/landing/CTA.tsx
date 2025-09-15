"use client";
import Link from "next/link";

export default function CTA() {
  return (
    <div className="mx-auto my-12 max-w-3xl rounded-3xl border-4 border-black bg-gradient-to-r from-lime-300 to-pink-300 p-8 text-center shadow-xl">
      <h3 className="text-2xl font-extrabold">🌟 READY TO CREATE?</h3>
      <p className="mt-2">Click “Products” to start your creative journey!</p>
      <Link
        href="/products"
        className="mt-6 inline-block rounded-2xl border-2 border-black px-6 py-3 font-bold hover:translate-y-0.5 active:translate-y-1"
      >
        Browse Products
      </Link>
    </div>
  );
}
