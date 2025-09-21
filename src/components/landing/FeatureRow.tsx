"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type FeatureRowProps = {
  imageSrc: string;
  title: string;
  body: string;
  reverse?: boolean; // when true: image on the right, text on the left
};

export default function FeatureRow({
  imageSrc,
  title,
  body,
  reverse,
}: FeatureRowProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  // slide from left/right on first paint, then settle when visible
  const initialTranslate = reverse ? "translate-x-6" : "-translate-x-6";

  return (
    <div
      ref={ref}
      className={[
        "grid items-center gap-8 md:grid-cols-2",
        "transition-all duration-700 ease-out",
        inView ? "opacity-100 translate-x-0" : `opacity-0 ${initialTranslate}`,
      ].join(" ")}
    >
      <div className={reverse ? "order-2 md:order-2" : "order-1"}>
        <div className="overflow-hidden rounded-3xl border-4 border-black shadow-[0_8px_0_#000]">
          <Image
            src={imageSrc}
            alt={title}
            width={1200}
            height={800}
            className="w-full h-auto object-cover"
            priority={false}
          />
        </div>
      </div>

      <div className={reverse ? "order-1 md:order-1" : "order-2"}>
        <h3 className="text-3xl md:text-4xl font-extrabold">{title}</h3>
        <p className="mt-4 text-lg leading-relaxed text-gray-800">{body}</p>
      </div>
    </div>
  );
}


