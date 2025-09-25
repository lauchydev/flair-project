"use client";

import Link from "next/link";
import { useMemo, useRef, type ReactNode } from "react";
import type { ShopifyProduct } from "@/types/api/shopify";
import ProductCard from "@/components/products/ProductCard";
import {
  AnimatePresence,
  motion,
  useInView,
  cubicBezier,
  type Variants,
} from "framer-motion";

interface HomeShowcaseSectionProps {
  featured?: ShopifyProduct[];
  loading?: boolean;
  title?: string;
  tagline?: string;
  ctaHref?: string;
  ctaLabel?: string;
}

const easeOutExpo = cubicBezier(0.22, 1, 0.36, 1);

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.98, filter: "blur(2px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: easeOutExpo },
  },
  exit: {
    opacity: 0,
    y: -16,
    scale: 0.98,
    filter: "blur(2px)",
    transition: { duration: 0.3, ease: easeOutExpo },
  },
};

function MotionOnView({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.35, margin: "-10% 0px -10% 0px" });

  return (
    <motion.div
      ref={ref}
      layout
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      exit="exit"
      variants={cardVariants}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HomeShowcaseSection({
  featured = [],
  loading = false,
  title = "Create. Personalise. Wear.",
  tagline = "Bring your ideas to life with vibrant custom gear.",
  ctaHref = "/products",
  ctaLabel = "✨ BROWSE PRODUCTS",
}: HomeShowcaseSectionProps) {
  const visible = (featured || []).slice(0, 2);
  const hasProducts = visible.length > 0;

  const sectionTitle = useMemo(
    () =>
      hasProducts
        ? `🔥 FEATURED ${visible.length === 1 ? "PRODUCT" : "PRODUCTS"}`
        : "🔥 FEATURED PRODUCTS",
    [hasProducts, visible.length]
  );

  return (
    <section className="space-y-16">
      {/* HERO */}
      <div className="flex flex-col items-center justify-center pt-10">
        <div className="relative inline-block">
          <div className="absolute -inset-2 -rotate-2 bg-yellow-300 rounded-3xl border-4 border-black shadow-xl" />
          <MotionOnView>
            <div className="relative bg-white rounded-3xl px-8 py-6 border-4 border-black shadow-xl transform rotate-1 hover:rotate-0 hover:scale-[1.01] transition-all duration-200">
              <div className="flex items-center justify-center gap-3 text-4xl sm:text-5xl mb-3">
                <span>🎨</span>
                <h1 className="font-black text-black">{title}</h1>
                <span>🧵</span>
              </div>
              <p className="text-center text-purple-700 font-bold">{tagline}</p>

              <div className="mt-6 flex justify-center">
                <Link
                  href={ctaHref}
                  className="bg-lime-400 text-black px-8 py-3 rounded-2xl border-4 border-black font-black hover:bg-lime-300 hover:scale-105 transition-all duration-150 shadow-lg"
                >
                  {ctaLabel}
                </Link>
              </div>

              {/* Decorative dots */}
              <div className="mt-3 flex justify-center space-x-2">
                <div className="w-3 h-3 bg-lime-400 rounded-full animate-pulse" />
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" />
              </div>
            </div>
          </MotionOnView>
        </div>
      </div>

      {/* FEATURE STRIP */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 px-4">
        {[
          { emoji: "⚡", title: "Fast Customisation", text: "Pick colours & add your flair." },
          { emoji: "🖼️", title: "Crisp Printing", text: "Vibrant detail, edge-to-edge." },
          { emoji: "🌱", title: "Quality Blanks", text: "Comfort-first, planet-friendly." },
        ].map((f, i) => (
          <MotionOnView key={f.title} delay={i * 0.08}>
            <div className="bg-white rounded-3xl p-6 border-4 border-black shadow-xl transform hover:-rotate-1 hover:scale-[1.01] transition-all duration-150">
              <div className="text-4xl mb-2">{f.emoji}</div>
              <h3 className="text-xl font-black text-black">{f.title}</h3>
              <p className="text-gray-800 font-bold">{f.text}</p>
            </div>
          </MotionOnView>
        ))}
      </div>

      {/* FEATURED PRODUCTS */}
      <div className="px-4">
        <MotionOnView>
          <div className="mb-8 text-center">
            <div className="inline-block bg-white rounded-3xl px-8 py-4 border-4 border-black shadow-xl transform rotate-1 hover:scale-105 transition-transform duration-200">
              <span className="text-2xl font-black text-black">{sectionTitle}</span>
              <div className="flex justify-center mt-2 space-x-2">
                <div className="w-3 h-3 bg-lime-400 rounded-full animate-pulse" />
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </MotionOnView>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-lime-400 to-purple-500 rounded-full border-4 border-black shadow-xl">
                <div className="w-full h-full rounded-full bg-gradient-to-r from-lime-400 to-purple-500 animate-pulse"></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🎨</div>
            </div>
            <div className="mt-8 bg-white rounded-3xl px-8 py-4 border-4 border-black shadow-xl">
              <p className="text-black font-black text-lg">Loading Featured…</p>
              <p className="text-purple-600 font-bold text-sm">✨ Hang tight! ✨</p>
            </div>
          </div>
        ) : hasProducts ? (
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="popLayout" initial={false}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 justify-items-center">
                {visible.map((product, index) => (
                  <MotionOnView key={product.id} delay={index * 0.06} className="w-full">
                    <ProductCard product={product} />
                  </MotionOnView>
                ))}
              </div>
            </AnimatePresence>
          </div>
        ) : (
          <MotionOnView>
            <div className="text-center py-16">
              <div className="max-w-lg mx-auto">
                <div className="text-8xl mb-6 animate-bounce">🛍️</div>
                <div className="bg-yellow-300 rounded-3xl p-8 border-4 border-black shadow-xl transform -rotate-2 mb-6">
                  <h3 className="text-3xl font-black text-black mb-4">Nothing Featured Yet!</h3>
                  <p className="text-gray-800 font-bold text-lg">
                    We’re curating some epic custom pieces for you.
                  </p>
                </div>
                <Link
                  href="/products"
                  className="bg-purple-500 text-white px-8 py-4 rounded-2xl border-4 border-black font-black text-lg hover:bg-purple-400 hover:scale-105 transition-all duration-150 shadow-xl"
                >
                  🔍 BROWSE ALL
                </Link>
              </div>
            </div>
          </MotionOnView>
        )}
      </div>

      {/* OUR STORY */}
      <div className="px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
          <MotionOnView className="md:col-span-3" delay={0.04}>
            <div className="bg-white rounded-3xl p-6 border-4 border-black shadow-xl transform rotate-1 hover:rotate-0 hover:scale-[1.01] transition-all duration-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">🧵</span>
                <h3 className="text-2xl font-black text-black">Our Story</h3>
              </div>
              <ul className="mt-4 space-y-4 text-sm text-gray-800 font-medium">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-lime-400 rounded-full mr-2 mt-2"></span>
                  Flair began with a dream to offer a community-oriented space that empowers artists to reach their fullest potential.
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 mt-2"></span>
                  Running a business or side hustle can be a taxing, time-consuming process, especially when juggling work and the responsibilities of daily life.
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-2 mt-2"></span>
                  That’s where Flair steps in. We help showcase, promote, and advocate for our artists so they feel supported as much as possible.
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-2 mt-2"></span>
                  This means more time for creation, and less time spent stressing over marketing, logistics, and administration.
                </li>
              </ul>
            </div>
          </MotionOnView>

          {/* Highlight card */}
          <MotionOnView delay={0.08} className="md:col-span-1">
            <div className="bg-gradient-to-br from-lime-100 to-pink-100 rounded-3xl p-6 border-4 border-black shadow-xl
                            flex flex-col items-center justify-center text-center transform -rotate-1 hover:rotate-0 hover:scale-[1.01]
                            transition-all duration-200 w-full md:max-w-xs md:ml-auto">
              <div className="text-6xl mb-2">✨</div>
              <p className="font-black text-lg text-black">Made to Order</p>
              <p className="text-gray-800 font-bold">Printed locally. Packed with care.</p>
            </div>
          </MotionOnView>
        </div>
      </div>

      {/* CTA STRIP */}
      <div className="px-4">
        <MotionOnView>
          <div className="bg-gradient-to-r from-lime-400 via-purple-500 to-pink-400 rounded-3xl p-6 border-4 border-black shadow-xl max-w-2xl mx-auto transform -rotate-1 hover:scale-105 hover:rotate-0 transition-all duration-300 mb-24 sm:mb-32">
            <h3 className="text-2xl font-black text-white mb-2">🌟 READY TO CREATE?</h3>
            <p className="text-white font-bold text-lg">
              Pick a product and click &quot;CUSTOMISE&quot; to start your creative journey!
            </p>
            <div className="mt-4">
              <Link
                href="/products"
                className="inline-block bg-white text-black px-6 py-3 rounded-2xl border-4 border-black font-black hover:scale-105 transition-all duration-150 shadow-lg"
              >
                🚀 START CUSTOMISING
              </Link>
            </div>
          </div>
        </MotionOnView>
      </div>
    </section>
  );
}
