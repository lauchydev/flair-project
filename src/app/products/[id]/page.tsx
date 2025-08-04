import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductDetailContent from "@/components/products/ProductDetailContent";

export default function ProductDetailPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <ProductDetailContent />
      </main>
      <Footer />
    </div>
  );
}
