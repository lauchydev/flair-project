import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FeatureRow from "@/components/landing/FeatureRow";
import HomeHero from "@/components/landing/HomeHero";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flair | Home",
  description: "Customise and create your own products",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow">
        <HomeHero />
      
        <section className="mx-auto max-w-6xl px-6 py-16 space-y-20">
          <FeatureRow
            imageSrc="/feature-1.jpg" 
            title="Design It Your Way"
            body="Pick a base, then tweak colors, artwork, and layout until it feels like you. Our tools are simple but powerful."
          />

          <FeatureRow
            reverse
            imageSrc="/feature-2.jpg"
            title="Made Fast, Made Well"
            body="We use quality materials and a streamlined checkout so your custom creations arrive quickly and look great."
          />

          <FeatureRow
            imageSrc="/feature-3.jpg" 
            title="Built For Makers"
            body="From side hustles to small brands, Flair gives you the tools to create, launch and iterate fast."
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
