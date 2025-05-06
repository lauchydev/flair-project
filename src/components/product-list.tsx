import Image from "next/image";

interface Product {
  id: number;
  name: string;
  price: number;
  type: string;
  image: string;
}

export default function ProductList({ products }: { products: Product[] }) {
  return (
    <div className="relative py-8 px-4 max-h-[75vh] overflow-y-auto">
      <div className="grid grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow max-w-[300px]"
          >
            <div className="relative aspect-[3/4]">
              <Image
                src={
                  product.image ||
                  "https://placehold.co/300x400/000000/FFFFFF/png"
                }
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="font-medium text-gray-900">{product.name}</h3>
              <p className="text-gray-700 mt-1">${product.price.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
