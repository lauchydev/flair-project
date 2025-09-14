import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

import Hero from "@/components/landing/Hero";
import ValueRibbon from "@/components/landing/ValueRibbon";
import Features from "@/components/landing/Features";
import SocialProof from "@/components/landing/SocialProof";
import CTA from "@/components/landing/CTA";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flair | Home",
  description: "Custom products you can design in minutes.",
  openGraph: {
    title: "Flair — Create your own dreams",
    description: "Design custom products fast with Flair.",
    url: "https://your-domain.example/", // replace when you have it
    siteName: "Flair",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Flair" }],
    type: "website",
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-lime-200">
      <Header />
      <main>
        <Hero />
        <ValueRibbon />
        <Features />
        {/* Remove SocialProof if you don’t want it yet */}
        <SocialProof />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

