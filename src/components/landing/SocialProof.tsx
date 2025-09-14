"use client";
import Image from "next/image";

// Section showing trusted brand logos
export default function SocialProof() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-6">
      <p className="text-center text-sm uppercase tracking-wide text-neutral-600">
        Trusted by makers & small brands
      </p>
      <div className="mt-4 grid grid-cols-2 items-center gap-6 md:grid-cols-4">
        {/* Replace these with your team/client logos */}
        <div className="relative h-10 w-full opacity-80">
          <Image src="/logo1.svg" alt="Brand 1" fill className="object-contain" />
        </div>
        <div className="relative h-10 w-full opacity-80">
          <Image src="/logo2.svg" alt="Brand 2" fill className="object-contain" />
        </div>
        <div className="relative h-10 w-full opacity-80">
          <Image src="/logo3.svg" alt="Brand 3" fill className="object-contain" />
        </div>
        <div className="relative h-10 w-full opacity-80">
          <Image src="/logo4.svg" alt="Brand 4" fill className="object-contain" />
        </div>
      </div>
    </section>
  );
}
