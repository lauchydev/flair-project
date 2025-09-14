"use client";
import Link from "next/link";

// Call To Action section at bottom of landing page
export default function CTA() {
  return (
    <section className="mx-auto my-12 max-w-3xl px-4">
      <div className="rounded-3xl border-4 border-black bg-gradient-to-r from-lime-300 to-pink-300 p-8 text-center shadow-[6px_6px_0px_#000]">
        <h3 className="text-2xl font-extrabold">🌟 Ready to Create?</h3>
        <p className="mt-2 text-sm text-neutral-800">
          Start with a base, then customize every detail. It’s quick and fun.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-2xl border-2 border-black px-6 py-3 font-bold transition-transform hover:translate-y-0.5 active:translate-y-1"
          aria-label="Browse products"
        >
          Browse Products
        </Link>
      </div>
    </section>
  );
}
