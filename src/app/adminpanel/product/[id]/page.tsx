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
  variants?: { edges: { node: VariantNode }[] };
  // metafields
  ci?:   { id?: string | null; type: string; value: string | null };
  ct?:   { id?: string | null; type: string; value: string | null };
  cc?:   { id?: string | null; type: string; value: string | null };
  ca?:   { id?: string | null; type: string; value: string | null };
  cim?:  { id?: string | null; type: string; value: string | null };
  cipv?: { id?: string | null; type: string; value: string | null };
  ctpv?: { id?: string | null; type: string; value: string | null };
  ccpv?: { id?: string | null; type: string; value: string | null };
  da?:   { id?: string | null; type: string; value: string | null }; // {mode, x,y,width,height}
};

// --- Design area is absolute within a virtual 800x800 canvas
const CANVAS_SIZE = 800;
type RectAbs = { x: number; y: number; width: number; height: number } | null;

export default function ProductDetailsPage() {
  const params = useParams() as { id: string };
  const productId = decodeURIComponent(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline edit
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");

  // Metafields toggles + prices
  const [customImage, setCustomImage] = useState(false);
  const [customText, setCustomText] = useState(false);
  const [customColours, setCustomColours] = useState(false);
  const [customImagePrice, setCustomImagePrice] = useState("0");
  const [customTextPrice, setCustomTextPrice] = useState("0");
  const [customColoursPrice, setCustomColoursPrice] = useState("0");

  // Design area (absolute within 800x800)
  const [designArea, setDesignArea] = useState<RectAbs>(null);
  const [designMode, setDesignMode] = useState(false);

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

  // Container (display box) metrics
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number; left: number; top: number } | null>(null);

  // We still keep a ref to ensure we can remeasure on load
  const imgElRef = useRef<HTMLImageElement | null>(null);

  const currentDesc = useMemo(() => {
    if (!product) return "";
    if (product.descriptionHtml && product.descriptionHtml.trim()) return product.descriptionHtml;
    return product.description || "";
  }, [product]);

  // --- Measure container
  const updateDisplayMetrics = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = {
      w: rect.width,
      h: rect.height,
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
    };
    setDisplaySize((prev) =>
      prev && prev.w === next.w && prev.h === next.h && prev.left === next.left && prev.top === next.top ? prev : next
    );
  };

  useEffect(() => {
    const onWin = () => updateDisplayMetrics();
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    updateDisplayMetrics();
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, []);

  // --- Drag to set design area in ABSOLUTE 800x800 coordinates
  const draggingRef = useRef<null | { startX: number; startY: number }>(null);

  function screenToAbsolute(clientX: number, clientY: number) {
    if (!displaySize) return null;
    const relX = clientX - displaySize.left;
    const relY = clientY - displaySize.top;
    if (relX < 0 || relY < 0 || relX > displaySize.w || relY > displaySize.h) return null;
    const scaleX = CANVAS_SIZE / displaySize.w;
    const scaleY = CANVAS_SIZE / displaySize.h;
    return {
      x: Math.max(0, Math.min(CANVAS_SIZE, relX * scaleX)),
      y: Math.max(0, Math.min(CANVAS_SIZE, relY * scaleY)),
    };
  }

  function clampRectAbs(r: RectAbs): RectAbs {
    if (!r) return r;
    const clamp = (v: number) => Math.max(0, Math.min(CANVAS_SIZE, v));
    const x = clamp(r.x);
    const y = clamp(r.y);
    const w = Math.max(0, clamp(r.width));
    const h = Math.max(0, clamp(r.height));
    // Ensure box stays inside 800x800
    return {
      x,
      y,
      width: Math.min(w, CANVAS_SIZE - x),
      height: Math.min(h, CANVAS_SIZE - y),
    };
  }

  function onDesignMouseDown(e: React.MouseEvent) {
    if (!designMode) return;
    e.preventDefault();
    draggingRef.current = { startX: e.clientX, startY: e.clientY };
    const p = screenToAbsolute(e.clientX, e.clientY);
    if (p) setDesignArea({ x: p.x, y: p.y, width: 1, height: 1 });
  }

  function onDesignMouseMove(e: React.MouseEvent) {
    if (!designMode || !draggingRef.current || !designArea) return;
    e.preventDefault();
    const start = draggingRef.current;
    const p1 = screenToAbsolute(start.startX, start.startY);
    const p2 = screenToAbsolute(e.clientX, e.clientY);
    if (!p1 || !p2) return;
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);
    setDesignArea(clampRectAbs({ x, y, width: w, height: h }));
  }

  function onDesignMouseUp() {
    if (!designMode) return;
    draggingRef.current = null;
  }

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

      // toggles + prices
      setCustomImage((data.ci?.value || "") === "true");
      setCustomText((data.ct?.value || "") === "true");
      setCustomColours((data.cc?.value || "") === "true");
      setCustomImagePrice(data.cipv?.value || "0");
      setCustomTextPrice(data.ctpv?.value || "0");
      setCustomColoursPrice(data.ccpv?.value || "0");

      // colours
      let list: string[] = [];
      try {
        const arr = data.ca?.value ? JSON.parse(data.ca.value) : [];
        list = Array.isArray(arr) ? (arr as string[]) : [];
      } catch {
        list = [];
      }
      setColours(list);
      if (!selectedColour && list.length) setSelectedColour(list[0]);

      // design area: accept absolute_box; auto-convert percent_box -> absolute_box
      try {
        const raw = data.da?.value ? JSON.parse(data.da.value) : null;
        if (raw && raw.mode === "absolute_box") {
          const clamp = (v: number) => Math.max(0, Math.min(CANVAS_SIZE, Number(v) || 0));
          setDesignArea({
            x: clamp(raw.x),
            y: clamp(raw.y),
            width: clamp(raw.width),
            height: clamp(raw.height),
          });
        } else if (raw && raw.mode === "percent_box") {
          const pClamp = (v: number) => Math.max(0, Math.min(1, Number(v) || 0));
          const abs = {
            x: Math.round(pClamp(raw.x) * CANVAS_SIZE),
            y: Math.round(pClamp(raw.y) * CANVAS_SIZE),
            width: Math.round(pClamp(raw.width) * CANVAS_SIZE),
            height: Math.round(pClamp(raw.height) * CANVAS_SIZE),
          };
          setDesignArea(clampRectAbs(abs));
        } else {
          setDesignArea(null);
        }
      } catch {
        setDesignArea(null);
      }

      // mapping — prefer server value if present, otherwise derive sequentially
      try {
        const m = data.cim?.value ? (JSON.parse(data.cim.value) as ColourImageMap) : null;
        if (m && typeof m === "object") {
          setColourImageMap(m);
        } else {
          setColourImageMap(buildSequentialMap(list, data.images?.edges ?? []));
        }
      } catch {
        setColourImageMap(buildSequentialMap(list, data.images?.edges ?? []));
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

  useEffect(() => { if (editingTitle) titleInputRef.current?.focus(); }, [editingTitle]);
  useEffect(() => { if (editingDesc)  descTextareaRef.current?.focus(); }, [editingDesc]);

  // Recompute sequential map when colours/images change, but preserve existing ids
  useEffect(() => {
    if (!colours.length) { setColourImageMap({}); return; }
    setColourImageMap((prev) => {
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

  // Save title/description
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

  // Save metafields (includes prices + mapping + designArea as ABSOLUTE box)
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
          designArea: designArea ? { mode: "absolute_box", ...designArea } : null,
        }),
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

  // Colour picking helpers
  function normalizeHexInput(value: string): string {
    let v = value.trim().toLowerCase();
    if (!v.startsWith("#")) v = "#" + v;
    v = "#" + v.slice(1).replace(/[^0-9a-f]/g, "").slice(0, 6);
    return v;
  }

  async function pickColour() {
    // @ts-ignore
    if (window.EyeDropper) {
      try {
        // @ts-ignore
        const eye = new window.EyeDropper();
        const result = await eye.open();
        const hex = result?.sRGBHex;
        if (hex) setColours((prev) => Array.from(new Set([...prev, hex.toLowerCase()])));
      } catch {}
    } else {
      const input = document.createElement("input");
      input.type = "color";
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.click();
      input.oninput = () => { if (input.value) setColours((prev) => Array.from(new Set([...prev, input.value.toLowerCase()]))); };
      input.onblur = () => input.remove();
    }
  }

  // Carousel
  function nextImage() {
    if (!images.length) return;
    setActiveIdx((i) => (i + 1) % images.length);
    requestAnimationFrame(updateDisplayMetrics);
  }
  function prevImage() {
    if (!images.length) return;
    setActiveIdx((i) => (i - 1 + images.length) % images.length);
    requestAnimationFrame(updateDisplayMetrics);
  }

  // --- Upload validation: only allow 800x800 images
  function getImageSize(file: File): Promise<{ w: number; h: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        URL.revokeObjectURL(url);
        resolve({ w, h });
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      };
      img.src = url;
    });
  }

  async function validateFilesAre800(files: File[]): Promise<{ valid: File[]; invalid: { name: string; w: number; h: number }[] }> {
    const results = await Promise.all(
      files.map(async (f) => {
        try {
          const { w, h } = await getImageSize(f);
          return { file: f, ok: w === 800 && h === 800, w, h };
        } catch {
          return { file: f, ok: false, w: NaN, h: NaN };
        }
      })
    );
    const valid = results.filter(r => r.ok).map(r => r.file);
    const invalid = results.filter(r => !r.ok).map(r => ({ name: r.file.name, w: r.w, h: r.h }));
    return { valid, invalid };
  }

  async function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    const { valid, invalid } = await validateFilesAre800(files);
    if (invalid.length) {
      const details = invalid
        .map(i => `• ${i.name}${Number.isFinite(i.w) ? ` (${i.w}x${i.h})` : ""}`)
        .join("\n");
      alert(`Only 800×800 images are allowed.\n\nSkipped:\n${details}`);
    }
    if (valid.length) {
      setPendingFiles((prev) => [...prev, ...valid]);
    }
    // reset input so the same file can be picked again later
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      if (newLen > 0) setActiveIdx(newLen - 1);
      setPendingFiles([]);
      requestAnimationFrame(updateDisplayMetrics);
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
    if (!id) { alert("This image has no id. Ensure your product query returns image { id }."); return; }
    if (!confirm("Remove this image from the product?")) return;

    setDeletingImage(true);
    try {
      const res = await fetch("/api/delete-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageId: id,
          productId: product?.id || "",
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

  // Compute overlay in container CSS pixels from ABSOLUTE 800x800 box
  const overlayRect = useMemo(() => {
    if (!designArea || !displaySize) return null;
    const scaleX = displaySize.w / CANVAS_SIZE;
    const scaleY = displaySize.h / CANVAS_SIZE;
    return {
      left: Math.round(designArea.x * scaleX),
      top: Math.round(designArea.y * scaleY),
      width: Math.max(1, Math.round(designArea.width * scaleX)),
      height: Math.max(1, Math.round(designArea.height * scaleY)),
    };
  }, [designArea, displaySize]);

  // Variant weight (optional)
  const firstVariant = product?.variants?.edges?.[0]?.node;
  const weightValue = firstVariant?.inventoryItem?.measurement?.weight?.value;
  const weightUnit = firstVariant?.inventoryItem?.measurement?.weight?.unit;
  const weightDisplay =
    weightValue != null && weightUnit ? `${weightValue} ${String(weightUnit).toLowerCase()}` : "No weight info";

  if (loading) return <p className="p-6">Loading...</p>;
  if (!product) return <p className="p-6">Product not found</p>;

  const primaryUrl = activeImage?.url || activeImage?.src || null;
  const primaryAlt = activeImage?.altText || product?.title || "Product image";

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
          <div
            ref={containerRef}
            className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
            onMouseDown={onDesignMouseDown}
            onMouseMove={onDesignMouseMove}
            onMouseUp={onDesignMouseUp}
          >
            {images.length ? (
              <>
                <img
                  ref={imgElRef}
                  src={primaryUrl || ""}
                  alt={primaryAlt}
                  className={`w-full h-full object-contain ${designMode ? "cursor-crosshair" : ""}`}
                  onLoad={() => requestAnimationFrame(updateDisplayMetrics)}
                />

                {/* overlay rect */}
                {overlayRect && (
                  <div
                    className="absolute border-2 border-blue-500/90 bg-blue-500/10 rounded"
                    style={{
                      left: overlayRect.left,
                      top: overlayRect.top,
                      width: overlayRect.width,
                      height: overlayRect.height,
                    }}
                  />
                )}

                {/* prev/next */}
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

                {designMode && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs rounded px-3 py-1 whitespace-nowrap shadow">
                    Click and drag to select the design area.
                  </div>
                )}
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
                  key={node.id || idx}
                  onClick={() => {
                    setActiveIdx(idx);
                    requestAnimationFrame(updateDisplayMetrics);
                  }}
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

          {/* Add images + Design Area */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFilesChosen}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded"
              type="button"
            >
              <PlusIcon className="w-5 h-5" />
              Add Images
            </button>

            <button
              onClick={() => setDesignMode((v) => !v)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded border ${designMode ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-900"}`}
              type="button"
              title="Select a design area (absolute 800×800)"
            >
              <PencilSquareIcon className="w-5 h-5" />
              {designMode ? "Finish Design Area" : "Design Area"}
            </button>

            {designArea && (
              <>
                <button
                  onClick={() => setDesignArea(null)}
                  className="text-sm underline text-gray-600"
                  type="button"
                >
                  Clear
                </button>
              </>
            )}

            {pendingFiles.length > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} ready (800×800)
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
              <button
                onClick={() => { setEditingTitle(false); setDraftTitle(product.title); }}
                className="p-2 rounded border"
                title="Cancel"
              >
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
                  <button
                    onClick={() => { setEditingDesc(false); setDraftDesc(currentDesc); }}
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

            {/* Colours list editor */}
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
                            onClick={() => {
                              setColours((prev) => prev.filter((_, i) => i !== idx));
                              if (selectedColour === hex) setSelectedColour(null);
                            }}
                          />
                          <input
                            type="text"
                            value={hex}
                            onChange={(e) => {
                              const v = normalizeHexInput(e.target.value);
                              setColours((prev) => prev.map((c, i) => (i === idx ? v : c)));
                            }}
                            className="w-28 px-2 py-1 border rounded text-sm"
                            placeholder="#rrggbb"
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
