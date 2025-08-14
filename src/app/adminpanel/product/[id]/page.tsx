"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  PlusIcon,
  EyeDropperIcon,
} from "@heroicons/react/24/outline";

type Product = {
  id: string;
  title: string;
  description?: string | null;
  descriptionHtml?: string | null;
  images?: { edges: { node: { url?: string | null; src?: string | null; altText?: string | null } }[] };
  variants?: { edges: { node: { id: string; title: string; price: string } }[] };
  ci?: { id?: string | null; type: string; value: string | null }; // custom.custom_image
  ct?: { id?: string | null; type: string; value: string | null }; // custom.custom_text
  cc?: { id?: string | null; type: string; value: string | null }; // custom.color_customisation
  ca?: { id?: string | null; type: string; value: string | null }; // custom.colours_available
  cipv?: { id?: string | null; type: string; value: string | null }; // custom.custom_image_price_variable
  ctpv?: { id?: string | null; type: string; value: string | null }; // custom.custom_text_price_variable
  ccpv?: { id?: string | null; type: string; value: string | null }; // custom.colour_customisation_price_variable
};

export default function ProductDetailsPage() {
  const params = useParams() as { id: string };
  const productId = decodeURIComponent(params.id); 


  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Description editing
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [draftDesc, setDraftDesc] = useState("");

  // Metafield editor state
  const [customImage, setCustomImage] = useState(false);
  const [customText, setCustomText] = useState(false);
  const [customColours, setCustomColours] = useState(false);
  const [colours, setColours] = useState<string[]>([]); // hex codes
  const [customImagePrice, setCustomImagePrice] = useState("0");
  const [customTextPrice, setCustomTextPrice] = useState("0");
  const [customColoursPrice, setCustomColoursPrice] = useState("0");

  const currentDesc = useMemo(() => {
    if (!product) return "";
    if (product.descriptionHtml && product.descriptionHtml.trim()) return product.descriptionHtml;
    return product.description || "";
  }, [product]);

  // Load product
  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const res = await fetch(`/api/get-product?id=${encodeURIComponent(productId)}`, { cache: "no-store" });
        const data = (await res.json()) as Product | null;
        setProduct(data);

        // Init metafields UI state
          if (data) {
            setCustomImage((data.ci?.value || "") === "true");
            setCustomText((data.ct?.value || "") === "true");
            setCustomColours((data.cc?.value || "") === "true");
            setCustomImagePrice(data.cipv?.value || "");
            setCustomTextPrice(data.ctpv?.value || "");
            setCustomColoursPrice(data.ccpv?.value || "");
          try {
            const arr = data.ca?.value ? JSON.parse(data.ca.value) : [];
            setColours(Array.isArray(arr) ? arr : []);
          } catch {
            setColours([]);
          }
        }
      } catch (e) {
        console.error("Failed to fetch product", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  useEffect(() => {
    if (isEditingDesc) setDraftDesc(currentDesc);
  }, [isEditingDesc, currentDesc]);

  // Save description 
  async function handleSaveDescription() {
    if (!product) return;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: product.id, description: draftDesc }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }
      if (!res.ok) {
        const msg = json?.userErrors?.[0]?.message || json?.error || "Failed to update product";
        alert(msg);
        return;
      }
      setProduct(json as Product);
      setIsEditingDesc(false);
    } catch (e: any) {
      console.error(e);
      alert(`Network error: ${e?.message || e}`);
    }
  }

  // Save metafields to Shopify
  async function handleSaveMetafields() {
    if (!product) return;
    try {
      const res = await fetch("/api/update-metafields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId, 
          customImage,
          customText,
          customColours,
          colours,
          customImagePrice,
          customTextPrice,
          customColoursPrice,
        }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }

      if (!res.ok) {
        console.error("Save metafields failed:", json);
        const msg =
          json?.error ||
          json?.userErrors?.[0]?.message ||
          json?.raw?.errors?.[0]?.message ||
          json?.rawText ||
          "Unknown error";
        alert(`Save failed:\n${msg}`);
        return;
      }

        alert("Options saved!");
      } catch (e: any) {
        console.error("Network error:", e);
        alert(`Network error: ${e?.message || e}`);
      }
    }

  // Eyedropper 
  async function pickColour() {
    // @ts-ignore
    if (window.EyeDropper) {
      try {
        // @ts-ignore
        const eye = new window.EyeDropper();
        const result = await eye.open();
        const hex = result?.sRGBHex;
        if (hex) setColours((prev) => Array.from(new Set([...prev, hex])));
      } catch {}
    } else {
      const input = document.createElement("input");
      input.type = "color";
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.click();
      input.oninput = () => {
        if (input.value) setColours((prev) => Array.from(new Set([...prev, input.value])));
      };
      input.onblur = () => input.remove();
    }
  }

  if (loading) return <p className="p-6">Loading...</p>;
  if (!product) return <p className="p-6">Product not found</p>;

  const imageUrl =
    product.images?.edges?.[0]?.node?.url ||
    product.images?.edges?.[0]?.node?.src ||
    null;
  const imageAlt = product.images?.edges?.[0]?.node?.altText || product.title;

  return (
    <div className="p-6">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/adminpanel" className="inline-flex items-center gap-2 text-gray-600 hover:text-black">
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Products
        </Link>

        {!isEditingDesc ? (
          <button onClick={() => setIsEditingDesc(true)} className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded">
            <PencilSquareIcon className="w-5 h-5" />
            Edit Description
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleSaveDescription} className="bg-black text-white px-4 py-2 rounded">Save</button>
            <button onClick={() => { setIsEditingDesc(false); setDraftDesc(currentDesc); }} className="px-4 py-2 rounded border">Cancel</button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: image */}
        <div className="flex-shrink-0">
          {imageUrl ? (
            <img src={imageUrl} alt={imageAlt} className="w-full md:w-[420px] h-auto object-cover rounded-lg shadow" />
          ) : (
            <div className="w-full md:w-[420px] h-[420px] bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
              No Image Available
            </div>
          )}
        </div>

        {/* Right: details + options */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold mb-4">{product.title}</h1>

          {/* Description */}
          {!isEditingDesc ? (
            <div className="prose max-w-none mb-8">
              {currentDesc ? <div dangerouslySetInnerHTML={{ __html: currentDesc }} /> : <p className="text-gray-700">No description</p>}
            </div>
          ) : (
            <div className="space-y-3 mb-8">
              <label className="block text-sm font-medium">Description (HTML allowed)</label>
              <textarea
                className="w-full min-h-[180px] p-3 border rounded"
                value={draftDesc}
                onChange={(e) => setDraftDesc(e.target.value)}
                placeholder="Enter product description"
              />
            </div>
          )}

          {/* Customisation Options */}
          <div className="p-4 border rounded">
            <h2 className="text-xl font-semibold mb-4">Customisation Options</h2>

            {/* Three options — each on its own line; checkbox inline with text */}
            <div className="flex flex-col gap-2 mb-4">
              <label className="inline-flex items-center gap-2">
                <span>Custom Image</span>
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={customImage}
                  onChange={(e) => setCustomImage(e.target.checked)}
                />
                  {customImage && (
                    <div>
                    <span style={{ marginLeft: '8px' }}>Extra Price</span>
                    <input 
                        type="text"
                        placeholder="Enter a price."
                        value={customImagePrice}
                        onChange={(e) => setCustomImagePrice(e.target.value)}
                        style={{ marginLeft: '6px' }}
                    />
                    </div>
                )}
                {/* Custom Image Price Variable (only if Custom Image = yes) (TO ADD) */}
              </label>

              <label className="inline-flex items-center gap-2">
                <span>Custom Text</span>
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={customText}
                  onChange={(e) => setCustomText(e.target.checked)}
                />
                  {customText && (
                    <div>
                    <span style={{ marginLeft: '8px' }}>Extra Price</span>
                    <input 
                        type="text"
                        placeholder="Enter a price."
                        value={customTextPrice}
                        onChange={(e) => setCustomTextPrice(e.target.value)}
                        style={{ marginLeft: '6px' }}
                    />
                    </div>
                )}
                {/* Custom Text Price Variable (only if Custom Image = yes) (TO ADD) */}
              </label>

              <label className="inline-flex items-center gap-2">
                <span>Custom Colour</span>
                <input
                  type="checkbox"
                  className="w-5 h-5"
                  checked={customColours}
                  onChange={(e) => setCustomColours(e.target.checked)}
               />
                {customColours && (
                    <div>
                    <span style={{ marginLeft: '8px' }}>Extra Price</span>
                    <input 
                        type="text"
                        placeholder="Enter a price."
                        value={customColoursPrice}
                        onChange={(e) => setCustomColoursPrice(e.target.value)}
                        style={{ marginLeft: '6px' }}
                    />
                    </div>
                )}
                {/* Custom Colour Price Variable (only if Custom Image = yes) (TO ADD) */}
              </label>
            </div>

            {/* Colours Available (only if Custom Colour = yes) */}
            {customColours && (
              <div className="mb-3">
                <div className="inline-flex items-center gap-2 mb-2">
                  <span className="font-medium">Colours Available</span>

                  {/* Eyedropper */}
                  <button
                    onClick={pickColour}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Pick colour"
                    type="button"
                  >
                    <EyeDropperIcon className="w-5 h-5 text-gray-700" />
                  </button>

                  {/* Plus */}
                  <button
                    onClick={() => setColours((prev) => [...prev, "#000000"])}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Add colour"
                    type="button"
                  >
                    <PlusIcon className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                {/* Swatches (click a swatch to remove) + editable hex text */}
                {colours.length === 0 ? (
                  <p className="text-sm text-gray-500">No colours yet.</p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {colours.map((hex, idx) => (
                      <div key={`${hex}-${idx}`} className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border cursor-pointer"
                          style={{ backgroundColor: hex }}
                          title={`${hex} — click to remove`}
                          onClick={() => setColours((prev) => prev.filter((_, i) => i !== idx))}
                        />
                        <input
                          type="text"
                          value={hex}
                          onChange={(e) => {
                            const v = e.target.value;
                            setColours((prev) => prev.map((c, i) => (i === idx ? v : c)));
                          }}
                          className="w-28 px-2 py-1 border rounded text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <button onClick={handleSaveMetafields} className="bg-black text-white px-4 py-2 rounded">
                Save Options
              </button>
            </div>
          </div>

          {/* Variants (optional) */}
          {product.variants?.edges?.length ? (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-2">Variants</h2>
              <ul className="space-y-1">
                {product.variants.edges.map(({ node }) => (
                  <li key={node.id} className="text-sm text-gray-600">
                    {node.title} — ${node.price}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
