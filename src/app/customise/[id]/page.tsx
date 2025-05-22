import Footer from "@/components/footer";
import Header from "@/components/header";
import Hero from "@/components/hero";
import ProductSection from "@/components/product-customisation";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <ProductSection />
      </main>
      <Footer />
    </div>
  );
}
