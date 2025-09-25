import { Metadata } from "next";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductsHero from "@/components/home/HomeHero";
import HomeShowcaseSection from "@/components/home/HomeShowcaseSection";

import { shopify } from "@/lib/shopify/client";
import { extractNodes, ShopifyProductsResponse, ShopifyProduct } from "@/types/api/shopify";

export const metadata: Metadata = {
  title: "Flair | Custom Creative Products",
  description: "Create, personalise, and wear your ideas with vibrant custom gear.",
};

export default async function HomePage() {
  let products: ShopifyProduct[] = [];

  try {
    const resp = (await shopify.getProducts(8)) as ShopifyProductsResponse;
    const conn = (resp as any)?.data?.products ?? (resp as any)?.products;
    products = extractNodes(conn);
  } catch (e) {
    console.error("[home] Failed to fetch products:", e);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-visible pb-24 sm:pb-10">
        <ProductsHero />
        <HomeShowcaseSection featured={products} loading={!products.length} />
      </main>
      <Footer />
    </div>
  );
}
