import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCustomizer from "@/components/products/customizer/ProductCustomizer";
import { shopify } from "@/lib/shopify/client";
import { ShopifyProductResponse } from "@/types/api/shopify";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const { productByHandle } = (await shopify.getProduct(
    id
  )) as ShopifyProductResponse;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        {productByHandle ? (
          <ProductCustomizer product={productByHandle} />
        ) : (
          <div className="container mx-auto px-4 py-24">
            <div className="rounded-3xl border-4 border-black bg-white p-10 text-center shadow-xl">
              <h1 className="text-3xl font-black text-black mb-2">
                Product not found
              </h1>
              <p className="text-gray-700 font-semibold">
                We couldn’t find a product with handle:{" "}
                <span className="font-black">{id}</span>
              </p>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
