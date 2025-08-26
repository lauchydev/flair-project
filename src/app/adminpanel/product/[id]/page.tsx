"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  PlusIcon,
  EyeDropperIcon,
  CheckIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

type ImageNode = {
  id?: string | null;
  url?: string | null;
  src?: string | null;
  altText?: string | null;
};

type ColourImageMap = Record<string, { front?: string | null; back?: string | null }>;

type Product = {
  id: string;
  title: string;
  description?: string | null;
  descriptionHtml?: string | null;
  images?: { edges: { node: ImageNode }[] };
  variants?: { edges: { node: { id: string; title: string; price: string; inventoryItem?: { measurement?: { weight?: { value?: number | null; unit?: string | null; }; }; }; } }[] };
  ci?: { id?: string | null; type: string; value: string | null }; // custom.custom_image
  ct?: { id?: string | null; type: string; value: string | null }; // custom.custom_text
  cc?: { id?: string | null; type: string; value: string | null }; // custom.color_customisation
  ca?: { id?: string | null; type: string; value: string | null }; // custom.colours_available
  cipv?: { id?: string | null; type: string; value: string | null }; // custom.custom_image_price_variable
  ctpv?: { id?: string | null; type: string; value: string | null }; // custom.custom_text_price_variable
  ccpv?: { id?: string | null; type: string; value: string | null }; // custom.colour_customisation_price_variable
  variants?: { edges: { node: { id: string; title: string; price: string } }[] };
  // metafields
  ci?: { type: string; value: string | null }; // custom.custom_image
  ct?: { type: string; value: string | null }; // custom.custom_text
  cc?: { type: string; value: string | null }; // custom.color_customisation
  ca?: { type: string; value: string | null }; // custom.colours_available
  cim?: { type: string; value: string | null }; // custom.colour_image_map
};

export default function ProductDetailsPage() {
  const params = useParams() as { id: string };
  const productId = decodeURIComponent(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline edit states
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");

  // Metafields UI
  const [customImage, setCustomImage] = useState(false);
  const [customText, setCustomText] = useState(false);
  const [customColours, setCustomColours] = useState(false);
  const [colours, setColours] = useState<string[]>([]); // #RRGGBB
  const [customImagePrice, setCustomImagePrice] = useState("0");
  const [customTextPrice, setCustomTextPrice] = useState("0");
  const [customColoursPrice, setCustomColoursPrice] = useState("0");

  // Selection + derived mapping
  const [selectedColour, setSelectedColour] = useState<string | null>(null);
  const [colourImageMap, setColourImageMap] = useState<ColourImageMap>({});

  // Carousel state
  const [activeIdx, setActiveIdx] = useState(0);

  // Deleting image state
  const [deletingImage, setDeletingImage] = useState(false);

  // Local upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  const images = product?.images?.edges ?? [];
  const activeImage = images[activeIdx]?.node;

  const currentDesc = useMemo(() => {
    if (!product) return "";
    if (product.descriptionHtml && product.descriptionHtml.trim()) return product.descriptionHtml;
    return product.description || "";
  }, [product]);

  function getImageById(imageId?: string | null): ImageNode | null {
    if (!imageId) return null;
    const edge = images.find((e) => e.node.id === imageId);
    return edge?.node || null;
  }

  function buildSequentialMap(cList: string[], imgEdges: { node: ImageNode }[]): ColourImageMap {
    const map: ColourImageMap = {};
    for (let i = 0; i < cList.length; i++) {
      const frontEdge = imgEdges[2 * i];
      const backEdge = imgEdges[2 * i + 1];
      map[cList[i]] = {
        front: frontEdge?.node?.id ?? null,
        back: backEdge?.node?.id ?? null,
      };
    }
    return map;
  }

  async function loadProduct() {
    const res = await fetch(`/api/get-product?id=${encodeURIComponent(productId)}`, { cache: "no-store" });
    const data = (await res.json()) as Product | null;
    setProduct(data);

    if (data) {
      setDraftTitle(data.title);
      setDraftDesc(data.descriptionHtml || data.description || "");
      setCustomImage((data.ci?.value || "") === "true");
      setCustomText((data.ct?.value || "") === "true");
      setCustomColours((data.cc?.value || "") === "true");
      setCustomImagePrice(data.cipv?.value || "");
      setCustomTextPrice(data.ctpv?.value || "");
      setCustomColoursPrice(data.ccpv?.value || "");

      try {
        const arr = data.ca?.value ? JSON.parse(data.ca.value) : [];
        const list = Array.isArray(arr) ? arr : [];
        setColours(list);
        if (!selectedColour && list.length) setSelectedColour(list[0]);
      } catch {
        setColours([]);
      }
      setColourImageMap({});
    }
  }

  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        await loadProduct();
      } catch {
        alert("Failed to load product");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  useEffect(() => { if (editingTitle) titleInputRef.current?.focus(); }, [editingTitle]);
  useEffect(() => { if (editingDesc)  descTextareaRef.current?.focus(); }, [editingDesc]);

  useEffect(() => {
    const next = buildSequentialMap(colours, images);
    setColourImageMap(next);
  }, [colours, images]);

  // --- Save title/description
  async function saveTitle() {
    if (!product) return;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, title: draftTitle }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }
      if (!res.ok) return alert(json?.error || "Failed to update title");
      setProduct(json as Product);
      setEditingTitle(false);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }

  async function saveDescription() {
    if (!product) return;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, descriptionHtml: draftDesc }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }
      if (!res.ok) return alert(json?.error || "Failed to update description");
      setProduct(json as Product);
      setEditingDesc(false);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }

  // --- Save metafields
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
        body: JSON.stringify({ id: productId, customImage, customText, customColours, colours, colourImageMap }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }
      if (!res.ok) {
        const msg = json?.error || json?.userErrors?.[0]?.message || json?.raw?.errors?.[0]?.message || json?.rawText || "Unknown error";
        return alert(`Save failed:\n${msg}`);
      }
      alert("Options saved!");
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }

  // Colour picking
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
      input.oninput = () => { if (input.value) setColours((prev) => Array.from(new Set([...prev, input.value]))); };
      input.onblur = () => input.remove();
    }
  }

  // --- Carousel controls
  function nextImage() {
    if (!images.length) return;
    setActiveIdx((i) => (i + 1) % images.length);
  }
  function prevImage() {
    if (!images.length) return;
    setActiveIdx((i) => (i - 1 + images.length) % images.length);
  }

  // --- Local file upload
  function openFilePicker() { fileInputRef.current?.click(); }
  function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    setPendingFiles((prev) => [...prev, ...files]);
  }
  async function uploadPendingFiles() {
    if (!pendingFiles.length) return;
    try {
      const fd = new FormData();
      fd.append("productId", productId);
      pendingFiles.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload-product-images", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) return alert(data?.error || "Upload failed");
      await loadProduct();
      setPendingFiles([]);
      setActiveIdx((product?.images?.edges?.length ?? 1) - 1);
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Delete current image
  async function deleteCurrentImage() {
    const node = activeImage;
    const id = node?.id;
    if (!id) {
      alert("This image has no id. Ensure your product query returns image { id }.");
      return;
    }
    if (!confirm("Remove this image from the product?")) return;

    setDeletingImage(true);
    try {
      const res = await fetch("/api/delete-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: id,                 // gid://shopify/ProductImage/... OR gid://shopify/MediaImage/...
          productId: product?.id || "",// helps REST fallback (we'll accept either gid or numeric)
        }),
      });

      const text = await res.text();
      let payload: any;
      try { payload = JSON.parse(text); } catch { payload = { nonJson: true, body: text }; }

      if (!res.ok) {
        const msg =
          payload?.error ||
          payload?.raw?.errors?.[0]?.message ||
          payload?.raw?.data?.productDeleteMedia?.userErrors?.[0]?.message ||
          payload?.body ||
          `HTTP ${res.status}`;
        console.error("[delete] failed payload:", payload);
        alert(`Failed to delete image\n\nID: ${id}\n${msg}`);
        return;
      }

      // Refresh product (mapping will auto-recompute from images)
      await loadProduct?.();

      // If we just deleted the last image, ensure index is clamped
      setActiveIdx((prev) => Math.max(0, Math.min(prev, (product?.images?.edges?.length ?? 1) - 1)));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[delete] network error", message);
      alert(`Network error: ${message}`);
    } finally {
      setDeletingImage(false);
    }
  }


  if (loading) return <p className="p-6">Loading...</p>;
  if (!product) return <p className="p-6">Product not found</p>;

  const firstVariant = product.variants?.edges?.[0]?.node;

  const weightValue = firstVariant?.inventoryItem?.measurement?.weight?.value;
  const weightUnit = firstVariant?.inventoryItem?.measurement?.weight?.unit;

  const weightDisplay =
    weightValue != null && weightUnit
      ? `${weightValue} ${weightUnit.toLowerCase()}`
      : "No weight info";

  /*const imageUrl =
    product.images?.edges?.[0]?.node?.url ||
    product.images?.edges?.[0]?.node?.src ||
    null;
  const imageAlt = product.images?.edges?.[0]?.node?.altText || product.title; */ /* Dont know what to do with this, conflict when merging*/
  const primaryUrl = activeImage?.url || activeImage?.src || null;
  const primaryAlt = activeImage?.altText || product.title;
  const primaryNode = activeImage;
  const primaryUrl = primaryNode?.url || primaryNode?.src || null;
  const primaryAlt = primaryNode?.altText || product.title;

  return (
    <div className="p-6">
      {/* Back */}
      <div className="mb-6">
        <Link href="/adminpanel" className="inline-flex items-center gap-2 text-gray-600 hover:text-black">
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Products
        </Link>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* LEFT: Image carousel + uploader */}
        <div className="flex-shrink-0 w-full md:w-[520px]">
          <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
            {images.length ? (
              <>
                <img src={primaryUrl || ""} alt={primaryAlt} className="w-full h-full object-contain" />

                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
                      title="Previous"
                      type="button"
                    >
                      <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
                      title="Next"
                      type="button"
                    >
                      <ChevronRightIcon className="w-6 h-6" />
                    </button>
                  </>
                )}

                <button
                  onClick={deleteCurrentImage}
                  disabled={deletingImage}
                  className={`absolute top-2 right-2 p-2 rounded bg-white/90 hover:bg-white shadow
                              ${deletingImage ? "opacity-60 cursor-not-allowed" : ""}`}
                  title={deletingImage ? "Deleting..." : "Delete image"}
                  type="button"
                  aria-disabled={deletingImage}
                >
                  <TrashIcon className="w-5 h-5 text-red-600" />
                </button>
              </>
            ) : (
              <div className="text-gray-500">No images</div>
            )}
          </div>

          {/* Thumbnails */}
          <div className="mt-3 flex gap-2 overflow-x-auto">
            {images.map((edge, idx) => {
              const node = edge.node;
              const thumb = node.url || node.src || "";
              return (
                <button
                  key={node.id || thumb || idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`border rounded overflow-hidden w-20 h-20 flex-shrink-0 ${idx === activeIdx ? "ring-2 ring-black" : ""}`}
                  title={`Image ${idx + 1}`}
                  type="button"
                >
                  {thumb ? (
                    <img src={thumb} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Add images (local) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFilesChosen}
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={openFilePicker}
              className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded"
              type="button"
            >
              <PlusIcon className="w-5 h-5" />
              Add Images
            </button>

            {pendingFiles.length > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} selected
                </span>
                <button
                  onClick={uploadPendingFiles}
                  className="inline-flex items-center gap-2 border px-3 py-2 rounded"
                  type="button"
                >
                  Upload
                </button>
              </>
            )}
          </div>
        </div>

        {/* RIGHT: details + editors */}
        <div className="flex-1">
          {/* Title with pencil */}
          {!editingTitle ? (
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold">{product.title}</h1>
              <button
                onClick={() => { setDraftTitle(product.title); setEditingTitle(true); }}
                className="p-1 rounded hover:bg-gray-100"
                title="Edit title"
                type="button"
              >
                <PencilSquareIcon className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-2">
              <input
                ref={titleInputRef}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="border rounded px-3 py-2 text-xl font-semibold flex-1"
              />
              <button onClick={saveTitle} className="p-2 rounded bg-black text-white" title="Save">
                <CheckIcon className="w-5 h-5" />
              </button>
              <button onClick={() => { setEditingTitle(false); setDraftTitle(product.title); }} className="p-2 rounded border" title="Cancel">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Description with pencil */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold">Description</h2>
              {!editingDesc && (
                <button
                  onClick={() => { setDraftDesc(currentDesc); setEditingDesc(true); }}
                  className="p-1 rounded hover:bg-gray-100"
                  title="Edit description"
                  type="button"
                >
                  <PencilSquareIcon className="w-5 h-5 text-gray-700" />
                </button>
              )}
            </div>

            {!editingDesc ? (
              <div className="prose max-w-none">
                {currentDesc ? <div dangerouslySetInnerHTML={{ __html: currentDesc }} /> : <p className="text-gray-700">No description</p>}
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <textarea
                  ref={descTextareaRef}
                  className="w-full min-h-[180px] p-3 border rounded"
                  value={draftDesc}
                  onChange={(e) => setDraftDesc(e.target.value)}
                  placeholder="Enter product description (HTML allowed)"
                />
                <div className="flex flex-col gap-2">
                  <button onClick={saveDescription} className="p-2 rounded bg-black text-white" title="Save">
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => { setEditingDesc(false); setDraftDesc(currentDesc); }} className="p-2 rounded border" title="Cancel">
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Customisation Options (metafields) */}
          <div className="p-4 border rounded">
            <h3 className="text-xl font-semibold mb-4">Customisation Options</h3>

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
              <p className="text-sm text-gray-500">Weight: {weightDisplay}</p>
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

            {customColours && (
              <>
                <div className="mb-3">
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span className="font-medium">Colours Available</span>
                    <button onClick={pickColour} className="p-1 rounded hover:bg-gray-100" title="Pick colour" type="button">
                      <EyeDropperIcon className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setColours((prev) => [...prev, "#000000"])}
                      className="p-1 rounded hover:bg-gray-100"
                      title="Add colour"
                      type="button"
                    >
                      <PlusIcon className="w-5 h-5 text-gray-700" />
                    </button>
                  </div>

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

                {/* Select active colour */}
                {colours.length > 0 && (
                  <div className="mb-3">
                    <div className="font-medium mb-1">Select Colour</div>
                    <div className="flex flex-wrap gap-2">
                      {colours.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => setSelectedColour(hex)}
                          className={`w-8 h-8 rounded-full border ${selectedColour === hex ? "ring-2 ring-black" : ""}`}
                          title={`Use ${hex}`}
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Compact front/back preview for the selected colour (no picker) */}
                {selectedColour && (
                  <div className="mt-4 p-3 border rounded">
                    <div className="inline-flex gap-3">
                      {(["front", "back"] as const).map((side) => {
                        const id = colourImageMap[selectedColour]?.[side] ?? null;
                        const node = getImageById(id);
                        const src = node?.url || node?.src || "";
                        return (
                          <div key={side} className="border rounded p-2">
                            <div className="text-xs text-gray-500 mb-1 capitalize">{side}</div>
                            <div className="w-32 h-32 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                              {src ? (
                                <img src={src} alt={`${side} preview`} className="w-full h-full object-contain" />
                              ) : (
                                <span className="text-gray-400 text-xs">Blank</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
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
              <h3 className="text-xl font-semibold mb-2">Variants</h3>
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
