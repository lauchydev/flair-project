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

type VariantNode = {
  id: string;
  title: string;
  price: string;
  inventoryItem?: {
    measurement?: {
      weight?: {
        value?: number | null;
        unit?: string | null;
      };
    };
  };
};

type ColourImageMap = Record<string, { front?: string | null; back?: string | null }>;

type Product = {
  id: string;
  title: string;
  description?: string | null;
  descriptionHtml?: string | null;
  images?: { edges: { node: ImageNode }[] };
  variants?: {
    edges: {
      node: {
        id: string;
        title: string;
        price: string;
        sku?: string | null;
        barcode?: string | null;
        inventoryQuantity?: number | null;
        inventoryItem?: {
          measurement?: {
            weight?: {
              value?: number | null;
              unit?: string | null;
            };
          };
        };
      };
    }[];
  };
  ci?: { id?: string | null; type: string; value: string | null }; // custom.custom_image
  ct?: { id?: string | null; type: string; value: string | null }; // custom.custom_text
  cc?: { id?: string | null; type: string; value: string | null }; // custom.color_customisation
  ca?: { id?: string | null; type: string; value: string | null }; // custom.colours_available
  cim?:  { id?: string | null; type: string; value: string | null }; // custom.colour_image_map (JSON)
  cipv?: { id?: string | null; type: string; value: string | null }; // custom.custom_image_price_variable
  ctpv?: { id?: string | null; type: string; value: string | null }; // custom.custom_text_price_variable
  ccpv?: { id?: string | null; type: string; value: string | null }; // custom.colour_customisation_price_variable
  po?: { id?: string | null; type: string; value: string | null }; // custom.product_owner
};

export default function ProductDetailsPage() {
  const params = useParams() as { id: string };
  const productId = decodeURIComponent(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline edit
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editingSku, setEditingSku] = useState(false);
  const [editingBarcode, setEditingBarcode] = useState(false);
  const [editingStock, setEditingStock] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [editingProductOwner, setEditingProductOwner] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftSku, setDraftSku] = useState("");
  const [draftBarcode, setDraftBarcode] = useState("");
  const [draftStock, setDraftStock] = useState("");
  const [draftWeight, setDraftWeight] = useState("");
  const [draftPrice, setDraftPrice] = useState("");

  // Metafields UI
  const [customImage, setCustomImage] = useState(false);
  const [customText, setCustomText] = useState(false);
  const [customColours, setCustomColours] = useState(false);
  const [customImagePrice, setCustomImagePrice] = useState("0");
  const [customTextPrice, setCustomTextPrice] = useState("0");
  const [customColoursPrice, setCustomColoursPrice] = useState("0");
  const [productOwner, setProductOwner] = useState("");

  // Colours + mapping
  const [colours, setColours] = useState<string[]>([]); // #RRGGBB
  const [selectedColour, setSelectedColour] = useState<string | null>(null);
  const [colourImageMap, setColourImageMap] = useState<ColourImageMap>({});

  // Carousel state
  const [activeIdx, setActiveIdx] = useState(0);
  const [deletingImage, setDeletingImage] = useState(false);

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Refs for autofocus
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  const images = product?.images?.edges ?? [];
  const activeImage = images[activeIdx]?.node;

  //temp designer emails
  const designeremails = ["designer1@example.com", "designer2@example.com", "test@example.com"];
  const currentUser = "designer2@example.com";
  const currentUserRole = "admin";

  const currentDesc = useMemo(() => {
    if (!product) return "";
    if (product.descriptionHtml && product.descriptionHtml.trim()) return product.descriptionHtml;
    return product.description || "";
  }, [product]);

  // Helpers
  function getImageById(imageId?: string | null): ImageNode | null {
    if (!imageId) return null;
    const edge = images.find((e) => e.node.id === imageId);
    return edge?.node || null;
  }

  function buildSequentialMap(cList: string[], imgEdges: { node: ImageNode }[]): ColourImageMap {
    // Enforces: image order is [c0.front, c0.back, c1.front, c1.back, ...]
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

  // Load product
  async function loadProduct(): Promise<Product | null> {
    const res = await fetch(`/api/get-product?id=${encodeURIComponent(productId)}`, { cache: "no-store" });
    const data = (await res.json()) as Product | null;
    setProduct(data);

    if (data) {
      // text
      setDraftTitle(data.title);
      setDraftDesc(data.descriptionHtml || data.description || "");

      // toggles
      setCustomImage((data.ci?.value || "") === "true");
      setCustomText((data.ct?.value || "") === "true");
      setCustomColours((data.cc?.value || "") === "true");

      // prices
      setCustomImagePrice(data.cipv?.value || "0");
      setCustomTextPrice(data.ctpv?.value || "0");
      setCustomColoursPrice(data.ccpv?.value || "0");
      setProductOwner(data.po?.value || "");

      const firstVariant = data.variants?.edges?.[0]?.node;
      if (!editingSku) setDraftSku(firstVariant?.sku ?? "");
      if (!editingBarcode) setDraftBarcode(firstVariant?.barcode ?? "");
      if (!editingStock) setDraftStock(firstVariant?.inventoryQuantity != null ? String(firstVariant.inventoryQuantity) : "");

      const weightValue = firstVariant?.inventoryItem?.measurement?.weight?.value;
      if (!editingWeight) {
        setDraftWeight(weightValue != null ? String(weightValue) : "");
      }

      // colours
      try {
        const arr = data.ca?.value ? JSON.parse(data.ca.value) : [];
        const list = Array.isArray(arr) ? (arr as string[]) : [];
        setColours(list);
        if (!selectedColour && list.length) setSelectedColour(list[0]);
      } catch {
        setColours([]);
      }

      // mapping — prefer server value if present, otherwise derive sequentially
      try {
        const m = data.cim?.value ? (JSON.parse(data.cim.value) as ColourImageMap) : null;
        if (m && typeof m === "object") {
          setColourImageMap(m);
        } else {
          setColourImageMap(buildSequentialMap(colours, data.images?.edges ?? []));
        }
      } catch {
        setColourImageMap(buildSequentialMap(colours, data.images?.edges ?? []));
      }
    }
    return data;
  }

  // Effects
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);
  
  // Auto-focus when entering edit
  useEffect(() => {
    if (editingTitle) titleInputRef.current?.focus();
  }, [editingTitle]);
  useEffect(() => {
    if (editingDesc) descTextareaRef.current?.focus();
  }, [editingDesc]);
  
  // Whenever colours or images change, recompute a sequential map IF we don't already have ids for the colour
  useEffect(() => {
    if (!colours.length) { setColourImageMap({}); return; }
    setColourImageMap((prev) => {
      // If prev already has ids for a given colour, keep them; otherwise fill from image order.
      const seq = buildSequentialMap(colours, images);
      const merged: ColourImageMap = {};
      for (const c of colours) {
        merged[c] = {
          front: prev[c]?.front ?? seq[c]?.front ?? null,
          back:  prev[c]?.back  ?? seq[c]?.back  ?? null,
        };
      }
      return merged;
    });
  }, [colours, images]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Save title/description/price
  async function savePrice() {
    if (!product) return;
    const variantId = product.variants?.edges?.[0]?.node?.id;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, variantId, price: draftPrice }),
      });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = { parseError: true, body: text };
      }
      if (!res.ok) return alert(json?.error || "Failed to update price");
      await loadProduct();
      setEditingPrice(false);
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    }
  }
  async function saveTitle() {
    if (!product) return;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, title: draftTitle }),
      });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = { parseError: true, body: text };
      }
      if (!res.ok) return alert(json?.error || "Failed to update title");
      setProduct(json as Product);
      setEditingTitle(false);
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    }
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
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = { parseError: true, body: text };
      }
      if (!res.ok) return alert(json?.error || "Failed to update description");
      setProduct(json as Product);
      setEditingDesc(false);
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    }
  }

  async function saveSku() {
    if (!product) return;
    const variantId = product.variants?.edges?.[0]?.node?.id;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, variantId, sku: draftSku }),
      });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = { parseError: true, body: text };
      }
      if (!res.ok) return alert(json?.error || "Failed to update SKU");
      await loadProduct();
      setEditingSku(false);
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    }
  }

  async function saveBarcode() {
    if (!product) return;
    const variantId = product.variants?.edges?.[0]?.node?.id;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, variantId, barcode: draftBarcode }),
      });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = { parseError: true, body: text };
      }
      if (!res.ok) return alert(json?.error || "Failed to update barcode");
      await loadProduct();
      setEditingBarcode(false);
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    }
  }

  async function saveStock() {
    if (!product) return;
    const variantId = product.variants?.edges?.[0]?.node?.id;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, variantId, inventoryQuantity: draftStock }),
      });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = { parseError: true, body: text };
      }
      if (!res.ok) return alert(json?.error || "Failed to update stock");
      await loadProduct();
      setEditingStock(false);
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    }
  }

  async function saveWeight() {
    if (!product) return;
    const variantId = product.variants?.edges?.[0]?.node?.id;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, variantId, weight: draftWeight }),
      });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = { parseError: true, body: text };
      }
      if (!res.ok) return alert(json?.error || "Failed to update weight");
      await loadProduct();
      setEditingWeight(false);
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    }
  }

  // Save metafields (includes prices + mapping)
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
          colourImageMap,
          customImagePrice,
          customTextPrice,
          customColoursPrice,
          productOwner: productOwner === "" ? "None@Set.test" : productOwner,
        }),
      });
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        json = { parseError: true, body: text };
      }
      if (!res.ok) {
        const msg =
          json?.error ||
          json?.userErrors?.[0]?.message ||
          json?.raw?.errors?.[0]?.message ||
          json?.rawText ||
          "Unknown error";
        return alert(`Save failed:\n${msg}`);
      }
      await loadProduct();
      alert("Options saved!");
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    }
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
      input.oninput = () => {
        if (input.value) setColours((prev) => Array.from(new Set([...prev, input.value])));
      };
      input.onblur = () => input.remove();
    }
  }

  // Carousel
  function nextImage() {
    if (!images.length) return;
    setActiveIdx((i) => (i + 1) % images.length);
  }
  function prevImage() {
    if (!images.length) return;
    setActiveIdx((i) => (i - 1 + images.length) % images.length);
  }


  // Upload
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

      const updated = await loadProduct();
      const newLen = updated?.images?.edges?.length ?? 0;
      if (newLen > 0) setActiveIdx(newLen - 1); // jump to last
      setPendingFiles([]);
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // Delete
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
          imageId: id,                  // gid://shopify/ProductImage/... OR gid://shopify/MediaImage/...
          productId: product?.id || "", // helps REST fallback if needed
        }),
      });

      const bodyText = await res.text();
      let payload: any;
      try { payload = JSON.parse(bodyText); } catch { payload = { nonJson: true, body: bodyText }; }

      if (!res.ok) {
        const msg =
          payload?.error ||
          payload?.raw?.errors?.[0]?.message ||
          payload?.raw?.data?.productDeleteMedia?.userErrors?.[0]?.message ||
          payload?.raw?.data?.productImageDelete?.userErrors?.[0]?.message ||
          payload?.body ||
          `HTTP ${res.status}`;
        console.error("[delete] failed payload:", payload);
        alert(`Failed to delete image\n\nID: ${id}\n${msg}`);
        return;
      }
      const updated = await loadProduct();
      const newLen = updated?.images?.edges?.length ?? 0;
      setActiveIdx((prev) => Math.max(0, Math.min(prev, Math.max(0, newLen - 1))));
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

  const primaryNode = activeImage;
  const primaryUrl = primaryNode?.url || primaryNode?.src || null;
  const primaryAlt = primaryNode?.altText || product.title;

  const firstVariant = product.variants?.edges?.[0]?.node;
  const weightValue = firstVariant?.inventoryItem?.measurement?.weight?.value;
  const weightUnit  = firstVariant?.inventoryItem?.measurement?.weight?.unit;
  const weightDisplay = weightValue != null && weightUnit ? `${weightValue} ${String(weightUnit).toLowerCase()}` : "No weight inf

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
                  className={`absolute top-2 right-2 p-2 rounded bg-white/90 hover:bg-white shadow ${
                    deletingImage ? "opacity-60 cursor-not-allowed" : ""
                  }`}
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
                  className={`border rounded overflow-hidden w-20 h-20 flex-shrink-0 ${
                    idx === activeIdx ? "ring-2 ring-black" : ""
                  }`}
                  title={`Image ${idx + 1}`}
                  type="button"
                >
                  {thumb ? (
                    <img src={thumb} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-2 00" />
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
                onClick={() => {
                  setDraftTitle(product.title);
                  setEditingTitle(true);
                }}
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
                className="text-3xl font-bold border rounded px-2 py-1"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
              />
              <button
                onClick={saveTitle}
                className="p-1 rounded bg-black text-white"
                title="Save title"
                type="button"
              >
                <CheckIcon className="w-5 h-5" />
              </button>
              <button className="p-2 rounded border" title="Cancel" type="button">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          {/* Description with pencil */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-lg font-semibold">Description</h2>
              {!editingDesc && (
                <button
                  onClick={() => {
                    setDraftDesc(currentDesc);
                    setEditingDesc(true);
                  }}
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
                {currentDesc ? (
                  <div dangerouslySetInnerHTML={{ __html: currentDesc }} />
                ) : (
                  <p className="text-gray-700">No description</p>
                )}
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
            {/* Price with pencil */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <h2 className="text-lg font-semibold">Price</h2>
                {!editingPrice && (
                  <button
                    onClick={() => {
                      setDraftPrice(product.variants?.edges?.[0]?.node?.price ?? "");
                      setEditingPrice(true);
                    }}
                    className="p-1 rounded hover:bg-gray-100"
                    title="Edit price"
                    type="button"
                  >
                    <PencilSquareIcon className="w-5 h-5 text-gray-700" />
                  </button>
                )}
              </div>

              {!editingPrice ? (
                <div className="prose max-w-none">
                  <span className="text-gray-700">${product.variants?.edges?.[0]?.node?.price ?? "No price"}</span>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <input
                    type="number"
                    className="w-full p-3 border rounded"
                    value={draftPrice}
                    onChange={(e) => setDraftPrice(e.target.value)}
                    placeholder="Enter product price"
                    min="0"
                  />
                  <div className="flex flex-col gap-2">
                    <button onClick={savePrice} className="p-2 rounded bg-black text-white" title="Save">
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingPrice(false);
                        setDraftPrice(product.variants?.edges?.[0]?.node?.price ?? "");
                      }}
                      className="p-2 rounded border"
                      title="Cancel"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          {/* Customisation Options (metafields) */}
          <div className="p-4 border rounded">
            <h3 className="text-xl font-semibold mb-4">Customisation Options</h3>
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2">
                  <span>Custom Image</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    checked={customImage}
                    onChange={(e) => setCustomImage(e.target.checked)}
                  />
                </label>
                {customImage && (
                  <label className="inline-flex items-center gap-2">
                    <span>Extra Price</span>
                    <input
                      type="text"
                      className="border rounded px-2 py-1 w-28"
                      placeholder="e.g. 5.00"
                      value={customImagePrice}
                      onChange={(e) => setCustomImagePrice(e.target.value)}
                    />
                  </label>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2">
                  <span>Custom Text</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    checked={customText}
                    onChange={(e) => setCustomText(e.target.checked)}
                  />
                </label>
                {customText && (
                  <label className="inline-flex items-center gap-2">
                    <span>Extra Price</span>
                    <input
                      type="text"
                      className="border rounded px-2 py-1 w-28"
                      placeholder="e.g. 3.00"
                      value={customTextPrice}
                      onChange={(e) => setCustomTextPrice(e.target.value)}
                    />
                  </label>
                )}
              </div>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2">
                  <span>Custom Colour</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5"
                    checked={customColours}
                    onChange={(e) => setCustomColours(e.target.checked)}
                  />
                </label>
                {customColours && (
                  <label className="inline-flex items-center gap-2">
                    <span>Extra Price</span>
                    <input
                      type="text"
                      className="border rounded px-2 py-1 w-28"
                      placeholder="e.g. 2.00"
                      value={customColoursPrice}
                      onChange={(e) => setCustomColoursPrice(e.target.value)}
                    />
                  </label>
                )}
              </div>
              <p className="text-sm text-gray-500">Weight: {weightDisplay}</p>
            </div>

            {customColours && (
              <>
                {/* Colours list editor */}
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
                            onClick={() => {
                              setColours((prev) => prev.filter((_, i) => i !== idx));
                              if (selectedColour === hex) setSelectedColour(null);
                            }}
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

                {/* Compact front/back preview for the selected colour */}
                {selectedColour && (
                  <div className="mt-4 p-3 border rounded">
                    <div className="inline-flex gap-3">
                      {(["front", "back"] as const).map((side) => {
                        const imgId = colourImageMap[selectedColour!]?.[side] ?? null;
                        const node = getImageById(imgId);
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
            <div className="mt-8 p-4 border rounded">
              <h3 className="text-xl font-semibold mb-4">Product Details</h3>
              <ul className="space-y-1">
                {product.variants.edges.map(({ node }) => (
                  <li key={node.id} className="text-sm text-gray-600">
                    <div className="mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">SKU:</span>
                        {!editingSku ? (
                          <span>{skuDisplay}</span>
                        ) : (
                          <>
                            <input value={draftSku} onChange={e => setDraftSku(e.target.value)} className="border rounded px-2 py-1" />
                            <button onClick={saveSku} className="p-2 rounded bg-black text-white" title="Save SKU" type="button">
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingSku(false); setDraftSku(skuDisplay); }} className="p-2 rounded border" title="Cancel" type="button">
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!editingSku && (
                          <button onClick={() => setEditingSku(true)} className="p-2 rounded hover:bg-gray-100" title="Edit SKU" type="button">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Barcode with pencil */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Barcode:</span>
                        {!editingBarcode ? (
                          <span>{barcodeDisplay}</span>
                        ) : (
                          <>
                            <input value={draftBarcode} onChange={e => setDraftBarcode(e.target.value)} className="border rounded px-2 py-1" />
                            <button onClick={saveBarcode} className="p-2 rounded bg-black text-white" title="Save Barcode" type="button">
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingBarcode(false); setDraftBarcode(barcodeDisplay); }} className="p-2 rounded border" title="Cancel" type="button">
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!editingBarcode && (
                          <button onClick={() => setEditingBarcode(true)} className="p-2 rounded hover:bg-gray-100" title="Edit Barcode" type="button">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Stock with pencil */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Stock:</span>
                        {!editingStock ? (
                          <span>{stockDisplay}</span>
                        ) : (
                          <>
                            <input value={draftStock} onChange={e => setDraftStock(e.target.value)} className="border rounded px-2 py-1" />
                            <button onClick={saveStock} className="p-2 rounded bg-black text-white" title="Save Stock" type="button">
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingStock(false); setDraftStock(String(stockDisplay)); }} className="p-2 rounded border" title="Cancel" type="button">
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!editingStock && (
                          <button onClick={() => setEditingStock(true)} className="p-2 rounded hover:bg-gray-100" title="Edit Stock" type="button">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Weight with pencil */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Weight:</span>
                        {!editingWeight ? (
                          <span>{weightDisplay}</span>
                        ) : (
                          <>
                            <input
                              type="number"
                              value={draftWeight}
                              onChange={e => setDraftWeight(e.target.value)}
                              className="border rounded px-2 py-1 w-24"
                              min="0"
                            />
                            <button onClick={saveWeight} className="p-2 rounded bg-black text-white" title="Save Weight" type="button">
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => { setEditingWeight(false); setDraftWeight(weightDisplay.split(' ')[0] || ""); }} className="p-2 rounded border" title="Cancel" type="button">
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!editingWeight && (
                          <button onClick={() => setEditingWeight(true)} className="p-2 rounded hover:bg-gray-100" title="Edit Weight" type="button">
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    {/* Product Owner */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Product Owner:</span>
                        {!editingProductOwner ? (
                          <span>{!productOwner || productOwner === "None@Set.test" ? "None Set" : productOwner}</span>
                        ) : (
                          <>
                            <select
                              value={productOwner}
                              onChange={e => setProductOwner(e.target.value)}
                              className="border rounded px-2 py-1"
                            >
                              <option value="">None set</option>
                              {designeremails.map(email => (
                                <option key={email} value={email}>{email}</option>
                              ))}
                            </select>
                            <button
                              onClick={async () => {
                                setEditingProductOwner(false);
                                await handleSaveMetafields();
                              }}
                              className="p-2 rounded bg-black text-white"
                              title="Save Product Owner"
                              type="button"
                            >
                              <CheckIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProductOwner(false);
                                setProductOwner(product.po?.value || "");
                              }}
                              className="p-2 rounded border"
                              title="Cancel"
                              type="button"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!editingProductOwner && currentUserRole === "admin" &&  (
                          <button
                            onClick={() => {
                              setEditingProductOwner(true);
                              setProductOwner(product.po?.value || "");
                            }}
                            className="p-2 rounded hover:bg-gray-100"
                            title="Edit Product Owner"
                            type="button"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
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
