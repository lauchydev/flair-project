"use client";

import { useState, useMemo } from "react";
import ProductList from "./product-list";
export default function ProductSection() {
  const [activeFilter, setActiveFilter] = useState("all");
  const types = ["shirt", "bottle", "test"];

  const getFilterLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      [types[0]]: "Shirts",
      [types[1]]: "Bottles",
      [types[2]]: "Test",
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1) + "s";
  };


const products = useMemo(() => [
    {
      id: crypto.randomUUID(),
      name: "Custom Shirt 1",
      price: 2.99,
      type: types[0],
      image: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Custom Bottle 1",
      price: 3.99,
      type: types[1],
      image: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Custom Shirt 2",
      price: 2.99,
      type: types[0],
      image: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Custom Bottle 2",
      price: 3.99,
      type: types[1],
      image: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Custom Shirt 3",
      price: 2.99,
      type: types[0],
      image: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Custom Shirt 4",
      price: 2.99,
      type: types[0],
      image: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Custom Bottle 3",
      price: 2.99,
      type: types[1],
      image: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Custom Bottle 4",
      price: 3.99,
      type: types[1],
      image: "",
    },
    {
      id: crypto.randomUUID(),
      name: "Custom Shirt 5",
      price: 2.99,
      type: types[0],
      image: "",
    },
  ], []);


  const filteredProducts =
    activeFilter === "all"
      ? products
      : products.filter((product) => product.type === activeFilter);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-black">Our Products</h2>

          {/* Filter Toggles */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-md ${
                activeFilter === "all"
                  ? "bg-gray-800 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => setActiveFilter(type)}
                className={`px-4 py-2 rounded-md ${
                  activeFilter === type
                    ? "bg-gray-800 text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {getFilterLabel(type)}
              </button>
            ))}
          </div>
        </div>

        <ProductList products={filteredProducts} />
      </div>
    </section>
  );
}
