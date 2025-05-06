"use client";

import { useState } from "react";
import ProductList from "./product-list";
export default function ProductSection() {
  const [activeFilter, setActiveFilter] = useState("all");

  const products = [
    {
      id: 1,
      name: "Custom Keychain 1",
      price: 2.99,
      type: "keychain",
      image: "",
    },
    {
      id: 2,
      name: "Custom Card 1",
      price: 3.99,
      type: "card",
      image: "",
    },
    {
      id: 3,
      name: "Custom Keychain 2",
      price: 2.99,
      type: "keychain",
      image: "",
    },
    {
      id: 4,
      name: "Custom Card 2",
      price: 3.99,
      type: "card",
      image: "",
    },
    {
      id: 5,
      name: "Custom Keychain 3",
      price: 2.99,
      type: "keychain",
      image: "",
    },
    {
      id: 6,
      name: "Custom Keychain 4",
      price: 2.99,
      type: "keychain",
      image: "",
    },
    {
      id: 7,
      name: "Custom Keychain 5",
      price: 2.99,
      type: "keychain",
      image: "",
    },
    {
      id: 8,
      name: "Custom Card 3",
      price: 3.99,
      type: "card",
      image: "",
    },
    {
      id: 9,
      name: "Custom Keychain 6",
      price: 2.99,
      type: "keychain",
      image: "",
    },
  ];

  const filteredProducts =
    activeFilter === "all"
      ? products
      : products.filter((product) => product.type === activeFilter);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Our Products</h2>

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
            <button
              onClick={() => setActiveFilter("keychain")}
              className={`px-4 py-2 rounded-md ${
                activeFilter === "keychain"
                  ? "bg-gray-800 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Keychains
            </button>
            <button
              onClick={() => setActiveFilter("card")}
              className={`px-4 py-2 rounded-md ${
                activeFilter === "card"
                  ? "bg-gray-800 text-white"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              Cards
            </button>
          </div>
        </div>

        <ProductList products={filteredProducts} />
      </div>
    </section>
  );
}
