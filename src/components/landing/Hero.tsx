"use client";
import Image from "next/image";

export default function Hero() {
  return (
    <header
      role="banner"
      className="relative w-full overflow-hidden bg-gradient-to-b from-yellow-200 to-yellow-100"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 px-4 py-20 text-center">
        {/* Brand mark (optional) */}
        <div className="relative h-12 w-28">
          <Image
            src="/favicon.ico"
            alt="Flair logo"
            fill
            sizes="112px"
            className="object-contain"
            priority
          />
        </div>

        <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Make It Yours with <span className="underline decoration-4">Flair</span>
        </h1>
        <p className="max-w-2xl text-balance text-base text-neutral-700 md:text-lg">
          Custom products, fast and fun. Choose a base, then personalize the details—
          colors, art, layout—until it feels like you.
        </p>
      </div>
    </header>
  );
}
