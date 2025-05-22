"use client";

import { useState } from "react";

export default function ProductCustomisation() {
  const [color, setColor] = useState("");
  const [image, setImage] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImage(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 grid md:grid-cols-2 gap-8 items-start">
      {/* Product Image */}
      <div className="w-full aspect-[3/4] bg-gray-100 rounded-xl shadow-inner flex items-center justify-center">
        {image ? (
          <img
            src={URL.createObjectURL(image)}
            alt="Custom preview"
            className="w-full h-full object-contain rounded-xl"
          />
        ) : (
          <span className="text-gray-400">Product Image Placeholder</span>
        )}
      </div>

      {/* Customisation Form */}
      <div className="space-y-6">
        <h2 className="text-3xl font-semibold">Customize Your Product</h2>

        {/* Color Selection */}
        <div className="space-y-1">
          <label htmlFor="color" className="block text-sm font-medium">
            Choose Color
          </label>
          <select
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2"
          >
            <option value="">Select a color</option>
            <option value="red">Red</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
          </select>
        </div>

        {/* Image Upload */}
        <div className="space-y-1">
          <label htmlFor="imageUpload" className="block text-sm font-medium">
            Upload Image
          </label>
          <input
            id="imageUpload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full"
          />
        </div>

        {/* Add to Cart Button */}
        <button className="bg-black text-white px-6 py-3 rounded-md w-full hover:bg-gray-800 transition">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
