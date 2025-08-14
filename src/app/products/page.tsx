import { Metadata } from "next";
import Header from "@/client/components/layout/Header";
import Footer from "@/client/components/layout/Footer";
import ProductsHero from "@/client/components/products/ProductsHero";
import ProductsSection from "@/client/components/products/ProductsSection";

export const metadata: Metadata = {
  title: "Flair | Products",
  description: "Browse our collection of customizable products",
};

export default function ProductsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <ProductsHero />
        <ProductsSection />
      </main>
      <Footer />
    </div>
  );
}
