"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserContext";
import {
  ArrowLeftIcon,
  PlusIcon,
  PencilSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
  CheckIcon,
  EyeDropperIcon,
} from "@heroicons/react/24/outline";

const CANVAS_SIZE = 800;
type RectAbs = { x: number; y: number; width: number; height: number } | null;

export default function AddProductPage() {
  const router = useRouter();

  // Required
  const [title, setTitle] = useState("");
  const [descriptionHtml, setDescriptionHtml] = useState("");
  const [price, setPrice] = useState("");

  // Optional basics
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");

  // Customisation (metafields)
  const [customImage, setCustomImage] = useState(false);
  const [customText, setCustomText] = useState(false);
  const [customColours, setCustomColours] = useState(false);
  const [customImagePrice, setCustomImagePrice] = useState("0");
  const [customTextPrice, setCustomTextPrice] = useState("0");
  const [customColoursPrice, setCustomColoursPrice] = useState("0");
  const { user } = useUser();
  const currentUserRole = user?.role || "";

  // Colours UI
  const [colours, setColours] = useState<string[]>([]);
  const [selectedColour, setSelectedColour] = useState<string | null>(null);
  const [localHexValues, setLocalHexValues] = useState<Record<number, string>>({});

  // Images
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [deletingImage, setDeletingImage] = useState(false);

  // Design area
  const [designMode, setDesignMode] = useState(false);
  const [designArea, setDesignArea] = useState<RectAbs>(null);

  // Display metrics for overlay
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number; left: number; top: number } | null>(null);

  // UI
  const [creating, setCreating] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (editingDesc) descTextareaRef.current?.focus(); }, [editingDesc]);

  const updateDisplayMetrics = () => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setDisplaySize({
      w: rect.width,
      h: rect.height,
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY,
    });
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
    const x = clamp(r.x), y = clamp(r.y), w = Math.max(0, clamp(r.width)), h = Math.max(0, clamp(r.height));
    return { x, y, width: Math.min(w, CANVAS_SIZE - x), height: Math.min(h, CANVAS_SIZE - y) };
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
  function onDesignMouseUp() { if (!designMode) return; draggingRef.current = null; }

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

  function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    setPendingFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    previews.forEach((u) => URL.revokeObjectURL(u));
    const urls = pendingFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    setActiveIdx((i) => Math.max(0, Math.min(i, Math.max(0, urls.length - 1))));
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFiles.length]);

  function nextImage() {
    if (!previews.length) return;
    setActiveIdx((i) => (i + 1) % previews.length);
    requestAnimationFrame(updateDisplayMetrics);
  }
  function prevImage() {
    if (!previews.length) return;
    setActiveIdx((i) => (i - 1 + previews.length) % previews.length);
    requestAnimationFrame(updateDisplayMetrics);
  }
  function deleteCurrentImage() {
    const idx = activeIdx;
    if (idx < 0 || idx >= pendingFiles.length) return;
    if (!confirm("Remove this image from the selection?")) return;
    setDeletingImage(true);
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
    setDeletingImage(false);
  }

  const primaryUrl = previews[activeIdx] || null;


  function normalizeHexInput(value: string): string {
    let v = value.replace("#", "").trim().toLowerCase();
    v = v.replace(/[^0-9a-f]/g, "").slice(0, 6);
    return "#" + v;
  }
  function handleHexInputChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    let value = e.target.value;
    if (!value.startsWith("#")) value = "#" + value.replace(/#/g, "");
    value = value.replace(/[^#0-9a-fA-F]/g, "");
    if (value.length > 7) value = value.slice(0, 7);
    setLocalHexValues((prev) => ({ ...prev, [idx]: value }));
  }
  async function pickColour() {
    // @ts-ignore
    if (window.EyeDropper) {
      try {
        // @ts-ignore
        const eye = new window.EyeDropper();
        const result = await eye.open();
        const hex = result?.sRGBHex;
        if (hex) {
          setColours((prev) => {
            const next = Array.from(new Set([...prev, hex.toLowerCase()]));
            if (!selectedColour && next.length) setSelectedColour(next[0]);
            return next;
          });
        }
      } catch {}
    } else {
      const input = document.createElement("input");
      input.type = "color";
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.click();
      input.oninput = () => {
        if (input.value) {
          setColours((prev) => {
            const next = Array.from(new Set([...prev, input.value.toLowerCase()]));
            if (!selectedColour && next.length) setSelectedColour(next[0]);
            return next;
          });
        }
      };
      input.onblur = () => input.remove();
    }
  }

  const canCreate =
    title.trim().length > 0 &&
    descriptionHtml.trim().length > 0 &&
    price.trim().length > 0 &&
    !Number.isNaN(Number(price)) &&
    pendingFiles.length >= 1;

  async function handleCreate() {
    if (!canCreate) {
      alert("Please add at least one image and enter a title, description, and price.");
      return;
    }
    setCreating(true);
    try {
      const createRes = await fetch("/api/create-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          descriptionHtml,
          price: String(price),
          sku: sku.trim() || undefined,
          barcode: barcode.trim() || undefined,
        }),
      });
      const createText = await createRes.text();
      let createJson: any; try { createJson = JSON.parse(createText); } catch { createJson = { raw: createText }; }
      if (!createRes.ok || !createJson?.product?.id) {
        const msg = createJson?.error || createJson?.userErrors?.[0]?.message || createJson?.raw || "Failed to create product";
        alert(msg);
        return;
      }
      const productId: string = createJson.product.id;


      if (pendingFiles.length) {
        const fd = new FormData();
        fd.append("productId", productId);
        pendingFiles.forEach((f) => fd.append("files", f));
        const uploadRes = await fetch("/api/upload-product-images", { method: "POST", body: fd });
        if (!uploadRes.ok) {
          const txt = await uploadRes.text();
          let err: any; try { err = JSON.parse(txt); } catch { err = { raw: txt }; }
          console.error("Upload failed:", err);
          alert(err?.error || "Image upload failed (product created). You can add images in the editor.");
        }
      }


      await fetch("/api/update-metafields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          customImage, customText, customColours,
          customImagePrice, customTextPrice, customColoursPrice,
          colours,                   
          colourImageMap: {},        
          designArea: designArea
            ? { x: Math.round(designArea.x), y: Math.round(designArea.y), width: Math.round(designArea.width), height: Math.round(designArea.height) }
            : null,
          productOwner: currentUserRole === "designer" ? user?.email || "" : "None@Set.test",
        }),
      }).catch(() => { /* ignore */ });


      router.replace(`/adminpanel/product/${encodeURIComponent(productId)}`);
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    } finally {
      setCreating(false);
    }
  }

  // Shared icon+hover text button
  const IconAction: React.FC<React.PropsWithChildren<{ title: string; onClick?: () => void; disabled?: boolean }>> = ({ children, title, onClick, disabled }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-center text-stone-700 hover:text-indigo-600 transition ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-stone-100">
      {/* Floating header */}
      <div className="sticky top-0 z-20 px-4 sm:px-6 py-3">
        <div className="relative rounded-2xl border border-stone-200 bg-stone-50/90 backdrop-blur shadow-md ring-1 ring-black/5">
          {/* Left: back */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Link href="/adminpanel" className="inline-flex items-center gap-2 text-stone-700 hover:text-stone-900">
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Back to Products</span>
            </Link>
          </div>

          {/* Center */}
          <div className="py-2.5 text-center">
            <h1 className="text-lg font-semibold tracking-tight text-stone-800">
              Add New Product
            </h1>
            <p className="text-[11px] text-stone-500">Create a product on Shopify</p>
          </div>

          {/* Right: Create */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!canCreate || creating}
              className={`inline-flex items-center gap-1 text-stone-700 hover:text-indigo-600 transition ${(!canCreate || creating) ? "opacity-50 cursor-not-allowed" : ""}`}
              title={!canCreate ? "Add at least one image, and enter title, description, and price" : "Create product"}
            >
              <CheckIcon className="h-5 w-5" />
              <span className="ml-1 text-sm">Create</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 pb-10">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LEFT: Media card */}
          <div className="rounded-2xl border border-stone-200 bg-stone-50 shadow-sm ring-1 ring-black/5">
            <div
              ref={containerRef}
              className={`relative m-3 w-auto aspect-square bg-stone-100 rounded-xl overflow-hidden flex items-center justify-center ${designMode ? "cursor-crosshair" : ""}`}
              onMouseDown={onDesignMouseDown}
              onMouseMove={onDesignMouseMove}
              onMouseUp={onDesignMouseUp}
            >
              {previews.length ? (
                <>
                  <img
                    src={primaryUrl || ""}
                    alt="Selected"
                    className="w-full h-full object-contain"
                    onLoad={() => requestAnimationFrame(updateDisplayMetrics)}
                  />

                  {overlayRect && (
                    <div
                      className="absolute border-2 border-blue-500/90 bg-blue-500/10 rounded-md"
                      style={{
                        left: overlayRect.left,
                        top: overlayRect.top,
                        width: overlayRect.width,
                        height: overlayRect.height,
                      }}
                    />
                  )}

                  {previews.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white shadow ring-1 ring-black/10"
                        title="Previous"
                        type="button"
                      >
                        <ChevronLeftIcon className="w-6 h-6 text-stone-700" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 hover:bg-white shadow ring-1 ring-black/10"
                        title="Next"
                        type="button"
                      >
                        <ChevronRightIcon className="w-6 h-6 text-stone-700" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={deleteCurrentImage}
                    disabled={deletingImage}
                    title={deletingImage ? "Deleting..." : "Remove image"}
                    type="button"
                    aria-disabled={deletingImage}
                    className={`absolute top-3 right-3 p-2 rounded-full bg-white/95 hover:bg-white shadow ring-1 ring-black/10 ${deletingImage ? "opacity-60 cursor-not-allowed" : ""}`}
                  >
                    <TrashIcon className="w-5 h-5 text-rose-600" />
                  </button>

                  {designMode && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs rounded px-3 py-1 shadow">
                      Click & drag to set the design area.
                    </div>
                  )}
                </>
              ) : (
                <div className="text-stone-500">No images yet</div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="px-3">
              <div className="flex gap-2 overflow-x-auto">
                {previews.map((thumb, idx) => (
                  <button
                    key={`${thumb}-${idx}`}
                    onClick={() => { setActiveIdx(idx); requestAnimationFrame(updateDisplayMetrics); }}
                    className={`relative border border-stone-200 bg-white rounded-xl overflow-hidden w-20 h-20 flex-shrink-0 ring-1 ring-black/5 transition ${idx === activeIdx ? "outline outline-2 outline-indigo-500" : "hover:scale-[1.01]"}`}
                    title={`Image ${idx + 1}`}
                    type="button"
                  >
                    <img src={thumb} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Actions row */}
            <div className="px-3 py-3 flex items-center gap-4">
              <IconAction title="Add Images" onClick={() => fileInputRef.current?.click()}>
                <PlusIcon className="h-5 w-5" />
                <span className="ml-1 max-w-0 opacity-0 transition-all duration-200 ease-out group-hover:max-w-[120px] group-hover:opacity-100 whitespace-nowrap text-sm">
                  Add Images
                </span>
              </IconAction>

              {pendingFiles.length > 0 && (
                <span className="text-xs text-stone-600">
                  {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} ready
                </span>
              )}

              <IconAction title={designMode ? "Finish Design Area" : "Design Area"} onClick={() => setDesignMode((v) => !v)}>
                <PencilSquareIcon className="h-5 w-5" />
                <span className="ml-1 max-w-0 opacity-0 transition-all duration-200 ease-out group-hover:max-w-[160px] group-hover:opacity-100 whitespace-nowrap text-sm">
                  {designMode ? "Finish Design Area" : "Design Area"}
                </span>
              </IconAction>
            </div>

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesChosen} />
          </div>

          {/* RIGHT: Details + Customisation */}
          <div className="space-y-5">
            {/* Title */}
            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm ring-1 ring-black/5 p-4 sm:p-5">
              <label className="block text-sm text-stone-800">
                <h4 className="text-lg font-semibold text-stone-900">Title</h4>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Product title"
                    className="flex-1 bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none text-stone-800"
                  />
                </div>
              </label>
            </div>

            {/* Description */}
            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm ring-1 ring-black/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-semibold text-stone-900">Description</h4>
                {!editingDesc && (
                  <button
                    onClick={() => setEditingDesc(true)}
                    className="p-1 rounded hover:bg-stone-100"
                    title="Edit description"
                    type="button"
                  >
                    <PencilSquareIcon className="w-5 h-5 text-stone-700" />
                  </button>
                )}
              </div>

              {!editingDesc ? (
                <div className="prose max-w-none text-stone-800">
                  {descriptionHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: descriptionHtml }} />
                  ) : (
                    <p className="text-stone-600">No description</p>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <textarea
                    ref={descTextareaRef}
                    className="w-full min-h-[140px] bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none text-stone-800"
                    value={descriptionHtml}
                    onChange={(e) => setDescriptionHtml(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") setEditingDesc(false); }}
                    placeholder="Enter product description (HTML allowed)"
                  />
                  <div className="flex flex-col gap-2 pt-1">
                    <button onClick={() => setEditingDesc(false)} className="text-stone-700 hover:text-indigo-600" title="Done" type="button">
                      <CheckIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Basic Details (stacked) */}
            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm ring-1 ring-black/5 p-4 sm:p-5">
              <h4 className="text-lg font-semibold text-stone-900 mb-4">Basic Details</h4>

              <label className="block text-sm text-stone-800 mb-3">
                Price
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="mt-1 block w-full bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none"
                  placeholder="e.g. 19.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>

              <label className="block text-sm text-stone-800 mb-3">
                SKU (optional)
                <input
                  type="text"
                  className="mt-1 block w-full bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none"
                  placeholder="e.g. BOT-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </label>

              <label className="block text-sm text-stone-800">
                Barcode (optional)
                <input
                  type="text"
                  className="mt-1 block w-full bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none"
                  placeholder="e.g. 1234567890123"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                />
              </label>
            </div>

            {/* Customisation Options */}
            <div className="rounded-2xl border border-stone-200 bg-stone-50 shadow-sm ring-1 ring-black/5 p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-stone-900">Customisation Options</h4>
              </div>

              <div className="mt-4 space-y-4">
                {/* Custom Image */}
                <div>
                  <label className="inline-flex items-center gap-3 text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customImage}
                      onChange={(e) => setCustomImage(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                        customImage ? "bg-indigo-500" : "bg-stone-300"
                      }`}
                    >
                      <span
                        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
                          customImage ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span>Custom Image</span>
                  </label>

                  {customImage && (
                    <div className="pl-14 pt-2">
                      <label className="block text-sm text-stone-800">
                        Extra Price
                        <input
                          type="text"
                          className="mt-1 block w-32 bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none"
                          placeholder="e.g. 5.00"
                          value={customImagePrice}
                          onChange={(e) => setCustomImagePrice(e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Custom Text */}
                <div>
                  <label className="inline-flex items-center gap-3 text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customText}
                      onChange={(e) => setCustomText(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                        customText ? "bg-indigo-500" : "bg-stone-300"
                      }`}
                    >
                      <span
                        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
                          customText ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span>Custom Text</span>
                  </label>

                  {customText && (
                    <div className="pl-14 pt-2">
                      <label className="block text-sm text-stone-800">
                        Extra Price
                        <input
                          type="text"
                          className="mt-1 block w-32 bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none"
                          placeholder="e.g. 3.00"
                          value={customTextPrice}
                          onChange={(e) => setCustomTextPrice(e.target.value)}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Custom Colour */}
                <div>
                  <label className="inline-flex items-center gap-3 text-stone-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customColours}
                      onChange={(e) => setCustomColours(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`relative h-6 w-11 rounded-full transition-colors duration-200 ${
                        customColours ? "bg-indigo-500" : "bg-stone-300"
                      }`}
                    >
                      <span
                        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform duration-200 ${
                          customColours ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span>Custom Colour</span>
                  </label>

                  {customColours && (
                    <div className="pl-14 pt-2">
                      <label className="block text-sm text-stone-800">
                        Extra Price
                        <input
                          type="text"
                          className="mt-1 block w-32 bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none"
                          placeholder="e.g. 2.00"
                          value={customColoursPrice}
                          onChange={(e) => setCustomColoursPrice(e.target.value)}
                        />
                      </label>

                      {/* Colours editor */}
                      <div className="mt-4">
                        <div className="inline-flex items-center gap-2 mb-2">
                          <span className="font-medium text-stone-900">Colours Available</span>
                          <button onClick={pickColour} className="p-1.5 rounded-md hover:bg-stone-100 ring-1 ring-inset ring-transparent hover:ring-stone-200" title="Pick colour" type="button">
                            <EyeDropperIcon className="w-5 h-5 text-stone-700" />
                          </button>
                          <button
                            onClick={() => {
                              setColours((prev) => {
                                const next = [...prev, "#000000"];
                                if (!selectedColour && next.length) setSelectedColour(next[0]);
                                return next;
                              });
                            }}
                            className="p-1.5 rounded-md hover:bg-stone-100 ring-1 ring-inset ring-transparent hover:ring-stone-200"
                            title="Add colour"
                            type="button"
                          >
                            <PlusIcon className="w-5 h-5 text-stone-700" />
                          </button>
                        </div>

                        {colours.length === 0 ? (
                          <p className="text-sm text-stone-500">No colours yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-3">
                            {colours.map((hex, idx) => (
                              <div key={`${hex}-${idx}`} className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded-lg border border-stone-300 bg-white cursor-pointer shadow-sm ring-1 ring-black/5"
                                  style={{ backgroundColor: hex }}
                                  title={`${hex} — click to remove`}
                                  onClick={() => {
                                    setColours((prev) => prev.filter((_, i) => i !== idx));
                                    if (selectedColour === hex) setSelectedColour(null);
                                  }}
                                />
                                <input
                                  type="text"
                                  value={localHexValues[idx] !== undefined ? localHexValues[idx] : hex}
                                  onChange={(e) => handleHexInputChange(e, idx)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Backspace" && e.currentTarget.value === "#") e.preventDefault();
                                    if (e.key === "Enter") {
                                      const normalized = normalizeHexInput(e.currentTarget.value);
                                      setColours((prev) => prev.map((c, i) => (i === idx ? normalized : c)));
                                      setLocalHexValues((prev) => { const next = { ...prev }; delete next[idx]; return next; });
                                    }
                                  }}
                                  onBlur={() => {
                                    const currentValue = localHexValues[idx] !== undefined ? localHexValues[idx] : hex;
                                    const normalized = normalizeHexInput(currentValue);
                                    setColours((prev) => prev.map((c, i) => (i === idx ? normalized : c)));
                                    setLocalHexValues((prev) => { const next = { ...prev }; delete next[idx]; return next; });
                                  }}
                                  className="w-28 px-1.5 py-1 bg-transparent border-0 border-b border-stone-300 text-sm focus:border-indigo-500 focus:ring-0 outline-none"
                                  placeholder="#RRGGBB"
                                  maxLength={7}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCreate}
                disabled={!canCreate || creating}
                className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow ring-1 ring-black/5 ${(!canCreate || creating) ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <CheckIcon className="w-4 h-4 mr-1" />
                Create Product
              </button>
              <div className="text-xs text-stone-600">
                Requirements: Image | Title | Description | Price
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
