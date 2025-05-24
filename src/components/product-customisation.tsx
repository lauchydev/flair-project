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

        {/* Colour Selection */}
        <div className="space-y-1">
          <label className="block text-sm font-medium mb-1">Choose a Color</label>
          <div className="flex items-center gap-2 flex-wrap">
            {["green", "red", "blue", "white", "black"].map((c) => (
              <button
                key={c}
                className={`w-8 h-8 rounded-full border-2 focus:outline-none ${
                  color === c ? "border-black" : "border-gray-300"
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
                type="button"
                aria-label={`Select ${c}`}
              />
            ))}

            {/* Custom Colour */}
            <label className="relative w-8 h-8 rounded-full border-2 overflow-hidden cursor-pointer">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Pick custom color"
              />
              <div
                className="w-full h-full rounded-full"
                style={{
                  background:
                    "conic-gradient(red, orange, yellow, green, cyan, blue, violet, red)",
                }}
              />
            </label>
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-1">
          <label className="block text-sm font-medium mb-1">Upload Image</label>
          <label
            htmlFor="imageUpload"
            className="bg-black text-white px-6 py-3 rounded-md inline-block cursor-pointer hover:bg-gray-800 transition"
          >
            Choose Image
            <input
              id="imageUpload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Add to Cart Button */}
        <button className="bg-black text-white px-6 py-3 rounded-md w-full hover:bg-gray-800 transition">
          Add to Cart
        </button>
      </div>
    </div>
  );
}
