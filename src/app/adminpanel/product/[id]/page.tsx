"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@/components/UserContext";
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
  ArrowUpTrayIcon,
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

type ColourImageMap = Record<string, { front?: string | null; back?: string | null }>;

type Product = {
  id: string;
  title: string;
  description?: string | null;
  descriptionHtml?: string | null;
  images?: { edges: { node: ImageNode }[] };
  variants?: { edges: { node: VariantNode }[] };

  ci?: { id?: string | null; type: string; value: string | null };
  ct?: { id?: string | null; type: string; value: string | null };
  cc?: { id?: string | null; type: string; value: string | null };
  ca?: { id?: string | null; type: string; value: string | null };
  cim?: { id?: string | null; type: string; value: string | null };
  cipv?: { id?: string | null; type: string; value: string | null };
  ctpv?: { id?: string | null; type: string; value: string | null };
  ccpv?: { id?: string | null; type: string; value: string | null };
  po?: { id?: string | null; type: string; value: string | null };
  da?: { id?: string | null; type: string; value: string | null };
};

const CANVAS_SIZE = 800;
type RectAbs = { x: number; y: number; width: number; height: number } | null;

export default function ProductDetailsPage() {
  const params = useParams() as { id: string };
  const productId = decodeURIComponent(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline edit toggles
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [editingProductOwner, setEditingProductOwner] = useState(false);

  // Per-variant editing toggles
  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  const [editingBarcodeId, setEditingBarcodeId] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<string | null>(null);

  // Draft fields
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDesc, setDraftDesc] = useState("");
  const [draftPrice, setDraftPrice] = useState("");
  const [draftWeight, setDraftWeight] = useState("");
  const [draftSku, setDraftSku] = useState("");
  const [draftBarcode, setDraftBarcode] = useState("");
  const [draftStock, setDraftStock] = useState("");

  // Metafields UI
  const [customImage, setCustomImage] = useState(false);
  const [customText, setCustomText] = useState(false);
  const [customColours, setCustomColours] = useState(false);
  const [customImagePrice, setCustomImagePrice] = useState("0");
  const [customTextPrice, setCustomTextPrice] = useState("0");
  const [customColoursPrice, setCustomColoursPrice] = useState("0");
  const [productOwner, setProductOwner] = useState("");

  // Colours + mapping
  const [colours, setColours] = useState<string[]>([]);
  const [selectedColour, setSelectedColour] = useState<string | null>(null);
  const [colourImageMap, setColourImageMap] = useState<ColourImageMap>({});

  // Local hex edit buffer
  const [localHexValues, setLocalHexValues] = useState<Record<number, string>>({});

  // Design area
  const [designArea, setDesignArea] = useState<RectAbs>(null);
  const [designMode, setDesignMode] = useState(false);

  // Image carousel
  const [activeIdx, setActiveIdx] = useState(0);
  const [deletingImage, setDeletingImage] = useState(false);

  // Upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  // Autofocus refs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Display metrics
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number; left: number; top: number } | null>(null);

  // User context
  const { user } = useUser();
  const currentUserRole = user?.role || "";
  const [designeremails, setDesignerEmails] = useState<string[]>([]);

  useEffect(() => {
    async function fetchDesignerEmails() {
      try {
        const res = await fetch("/api/get-designer-emails");
        const data = await res.json();
        setDesignerEmails(data.emails || []);
      } catch {
        setDesignerEmails([]);
      }
    }
    fetchDesignerEmails();
  }, []);

  const images = product?.images?.edges ?? [];
  const activeImage = images[activeIdx]?.node;

  const currentDesc = useMemo(() => {
    if (!product) return "";
    if (product.descriptionHtml && product.descriptionHtml.trim()) return product.descriptionHtml;
    return product.description || "";
  }, [product]);

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

  // Drag for design area
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
  function onDesignMouseUp() {
    if (!designMode) return;
    draggingRef.current = null;
  }

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
      map[cList[i]] = { front: frontEdge?.node?.id ?? null, back: backEdge?.node?.id ?? null };
    }
    return map;
  }
  function findColourBadgeForImage(imageId?: string | null): { hex: string; side: "front" | "back" } | null {
    if (!imageId) return null;
    for (const [hex, sides] of Object.entries(colourImageMap)) {
      if (sides.front === imageId) return { hex, side: "front" };
      if (sides.back === imageId) return { hex, side: "back" };
    }
    return null;
  }

  // Load product
  async function loadProduct(): Promise<Product | null> {
    const res = await fetch(`/api/get-product?id=${encodeURIComponent(productId)}`, { cache: "no-store" });
    const data = (await res.json()) as Product | null;
    setProduct(data);

    if (data) {
      setDraftTitle(data.title);
      setDraftDesc(data.descriptionHtml || data.description || "");
      setCustomImage((data.ci?.value || "") === "true");
      setCustomText((data.ct?.value || "") === "true");
      setCustomColours((data.cc?.value || "") === "true");
      setCustomImagePrice(data.cipv?.value || "0");
      setCustomTextPrice(data.ctpv?.value || "0");
      setCustomColoursPrice(data.ccpv?.value || "0");
      setProductOwner(data.po?.value || "");

      const firstVariant = data.variants?.edges?.[0]?.node;
      if (firstVariant) {
        setDraftSku(firstVariant.sku ?? "");
        setDraftBarcode(firstVariant.barcode ?? "");
        setDraftStock(firstVariant.inventoryQuantity != null ? String(firstVariant.inventoryQuantity) : "");
        const weightValue = firstVariant.inventoryItem?.measurement?.weight?.value;
        setDraftWeight(weightValue != null ? String(weightValue) : "");
        setDraftPrice(firstVariant.price ?? "");
      }

      let list: string[] = [];
      try {
        const arr = data.ca?.value ? JSON.parse(data.ca.value) : [];
        list = Array.isArray(arr) ? (arr as string[]) : [];
      } catch {
        list = [];
      }
      setColours(list);
      if (!selectedColour && list.length) setSelectedColour(list[0]);

      try {
        const m = data.cim?.value ? (JSON.parse(data.cim.value) as ColourImageMap) : null;
        if (m && typeof m === "object") setColourImageMap(m);
        else setColourImageMap(buildSequentialMap(list, data.images?.edges ?? []));
      } catch {
        setColourImageMap(buildSequentialMap(list, data.images?.edges ?? []));
      }

      try {
        const raw = data.da?.value ? JSON.parse(data.da.value) : null;
        if (raw && typeof raw === "object") {
          const clamp800 = (v: any) => Math.max(0, Math.min(CANVAS_SIZE, Number(v) || 0));
          const abs = { x: clamp800(raw.x), y: clamp800(raw.y), width: clamp800(raw.width), height: clamp800(raw.height) };
          setDesignArea(clampRectAbs(abs));
        } else setDesignArea(null);
      } catch {
        setDesignArea(null);
      }
    }
    return data;
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

  function mapsEqual(a: ColourImageMap, b: ColourImageMap) {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (const k of ka) {
      const av = a[k] ?? { front: null, back: null };
      const bv = b[k] ?? { front: null, back: null };
      if (av.front !== bv.front || av.back !== bv.back) return false;
    }
    return true;
  }
  function buildMergedMap(cList: string[], imgEdges: { node: ImageNode }[], prev: ColourImageMap): ColourImageMap {
    const seq = buildSequentialMap(cList, imgEdges);
    const merged: ColourImageMap = {};
    for (const c of cList) {
      merged[c] = {
        front: prev[c]?.front ?? seq[c]?.front ?? null,
        back:  prev[c]?.back  ?? seq[c]?.back  ?? null,
      };
    }
    return merged;
  }
  const lastInputsKeyRef = useRef<string>("");
  useEffect(() => {
    const imageKeys = images.map(e => e?.node?.id ?? e?.node?.url ?? e?.node?.src ?? "");
    const key = JSON.stringify({ colours, images: imageKeys });

    if (lastInputsKeyRef.current === key) return;
    lastInputsKeyRef.current = key;

    if (!colours.length) {
      setColourImageMap(prev => (Object.keys(prev).length ? {} : prev));
      return;
    }

    setColourImageMap(prev => {
      const next = buildMergedMap(colours, images, prev);
      return mapsEqual(prev, next) ? prev : next;
    });
  }, [colours, images]);

  // Save helpers
  async function savePrice() {
    if (!product) return;
    const variantId = product.variants?.edges?.[0]?.node?.id;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, variantId, price: draftPrice }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }
      if (!res.ok) return alert(json?.error || "Failed to update price");
      await loadProduct(); setEditingPrice(false);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }
  async function saveTitle() {
    if (!product) return;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, title: draftTitle }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }
      if (!res.ok) return alert(json?.error || "Failed to update title");
      setProduct(json as Product); setEditingTitle(false);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }
  async function saveDescription() {
    if (!product) return;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, descriptionHtml: draftDesc }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }
      if (!res.ok) return alert(json?.error || "Failed to update description");
      setProduct(json as Product); setEditingDesc(false);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }
  async function saveSku() {
    if (!product) return;
    const variantId = editingSkuId || product.variants?.edges?.[0]?.node?.id;
    if (!variantId) return;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, variantId, sku: draftSku }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }
      if (!res.ok) return alert(json?.error || "Failed to update SKU");
      await loadProduct(); setEditingSkuId(null);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }
  async function saveBarcode() {
    if (!product) return;
    const variantId = editingBarcodeId || product.variants?.edges?.[0]?.node?.id;
    if (!variantId) return;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, variantId, barcode: draftBarcode }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }
      if (!res.ok) return alert(json?.error || "Failed to update barcode");
      await loadProduct(); setEditingBarcodeId(null);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }
  async function saveStock() {
    if (!product) return;
    const variantId = editingStock || product.variants?.edges?.[0]?.node?.id;
    if (!variantId) return;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, variantId, inventoryQuantity: draftStock }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }
      if (!res.ok) return alert(json?.error || "Failed to update stock");
      await loadProduct(); setEditingStock(null);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }
  async function saveWeight() {
    if (!product) return;
    const variantId = product.variants?.edges?.[0]?.node?.id;
    if (!variantId) return;
    try {
      const res = await fetch("/api/update-product", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, variantId, weight: draftWeight }),
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }
      if (!res.ok) return alert(json?.error || "Failed to update weight");
      await loadProduct(); setEditingWeight(false);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }

  // Save Options (metafields)
  async function handleSaveMetafields() {
    if (!product) return;

    const ownerStr =
      productOwner && productOwner !== "None@Set.test"
        ? productOwner
        : "";


    const daPayload = designArea
      ? {
          x: Math.round(designArea.x),
          y: Math.round(designArea.y),
          width: Math.round(designArea.width),
          height: Math.round(designArea.height),
        }
      : { x: 0, y: 0, width: 0, height: 0 };

    const body = {
      id: productId,
      customImage,
      customText,
      customColours,
      colours,          
      colourImageMap,
      customImagePrice,
      customTextPrice,
      customColoursPrice,
      productOwner: ownerStr,
      designArea: daPayload,
    };

    try {
      const res = await fetch("/api/update-metafields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { parseError: true, body: text }; }

      if (!res.ok) {
        const msg =
          json?.error ||
          json?.userErrors?.[0]?.message ||
          json?.raw?.errors?.[0]?.message ||
          json?.rawText ||
          "Unknown error";
        alert(`Save failed:\n${msg}`);
        return;
      }
      await loadProduct();
      alert("Options saved!");
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    }
  }


  // Colour input helpers
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

  // EyeDropper / fallback
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
      input.oninput = () => {
        if (input.value) setColours((prev) => Array.from(new Set([...prev, input.value.toLowerCase()])));
      };
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

  // Upload
  async function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;

    setPendingFiles((prev) => [...prev, ...files]);

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

  // Delete current image
  async function deleteCurrentImage() {
    const id = activeImage?.id;
    if (!id) { alert("This image has no id. Ensure your product query returns image { id }."); return; }
    if (!confirm("Remove this image from the product?")) return;

    setDeletingImage(true);
    try {
      const res = await fetch("/api/delete-product-image", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageId: id, productId: product?.id || "" }),
      });
      const bodyText = await res.text();
      let payload: any; try { payload = JSON.parse(bodyText); } catch { payload = { nonJson: true, body: bodyText }; }
      if (!res.ok) {
        const msg =
          payload?.error ||
          payload?.raw?.errors?.[0]?.message ||
          payload?.raw?.data?.productDeleteMedia?.userErrors?.[0]?.message ||
          payload?.raw?.data?.productImageDelete?.userErrors?.[0]?.message ||
          payload?.body || `HTTP ${res.status}`;
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

  const firstVariant = product?.variants?.edges?.[0]?.node;
  const weightValue = firstVariant?.inventoryItem?.measurement?.weight?.value;
  const weightUnit = firstVariant?.inventoryItem?.measurement?.weight?.unit;
  const weightDisplay =
    weightValue != null && weightUnit ? `${weightValue} ${String(weightUnit).toLowerCase()}` : "No weight info";

  if (loading) return <p className="p-6 text-stone-600">Loading...</p>;
  if (!product) return <p className="p-6 text-stone-600">Product not found</p>;

  const primaryUrl = activeImage?.url || activeImage?.src || null;
  const primaryAlt = activeImage?.altText || product?.title || "Product image";
  const mainBadge = findColourBadgeForImage(activeImage?.id);

  // shared icon+hover text button
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

          {/* Center: title */}
          <div className="py-2.5 text-center">
            {!editingTitle ? (
              <h1 className="text-lg font-semibold tracking-tight text-stone-800">
                {product.title}
                <button
                  onClick={() => { setDraftTitle(product.title); setEditingTitle(true); }}
                  className="ml-2 align-middle text-stone-500 hover:text-indigo-600"
                  title="Edit title"
                >
                  <PencilSquareIcon className="inline h-4 w-4" />
                </button>
              </h1>
            ) : (
              <span className="inline-flex items-center gap-2">
                <input
                  ref={titleInputRef}
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle();
                    if (e.key === "Escape") { setEditingTitle(false); setDraftTitle(product.title); }
                  }}
                  className="bg-transparent text-lg font-semibold tracking-tight text-stone-800 border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none px-1"
                />
                <button
                  onClick={saveTitle}
                  className="text-stone-700 hover:text-indigo-600"
                  title="Save"
                  type="button"
                >
                  <CheckIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setEditingTitle(false); setDraftTitle(product.title); }}
                  className="text-stone-700 hover:text-stone-900"
                  title="Cancel"
                  type="button"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </span>
            )}
            <p className="text-[11px] text-stone-500">Edit product details</p>
          </div>

          {/* Right: Save Options */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <IconAction title="Save Options" onClick={handleSaveMetafields}>
              <CheckIcon className="h-5 w-5" />
              <span className="ml-1 max-w-0 opacity-0 transition-all duration-200 ease-out group-hover:max-w-[70px] group-hover:opacity-100 whitespace-nowrap text-sm">
                Save
              </span>
            </IconAction>
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
              {images.length ? (
                <>
                  <img
                    ref={imgElRef}
                    src={primaryUrl || ""}
                    alt={primaryAlt}
                    className="w-full h-full object-contain"
                    onLoad={() => requestAnimationFrame(updateDisplayMetrics)}
                  />

                  {/* main image colour/side badge */}
                  {mainBadge && (
                    <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs text-stone-700 shadow ring-1 ring-black/10">
                      <span
                        className="inline-block h-3 w-3 rounded-full ring-1 ring-stone-300"
                        style={{ backgroundColor: mainBadge.hex }}
                        aria-hidden
                      />
                      <span className="capitalize">{mainBadge.side}</span>
                    </div>
                  )}

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

                  {images.length > 1 && (
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
                    title={deletingImage ? "Deleting..." : "Delete image"}
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
                <div className="text-stone-500">No images</div>
              )}
            </div>

            {/* Thumbnails */}
            <div className="px-3">
              <div className="flex gap-2 overflow-x-auto">
                {images.map((edge, idx) => {
                  const node = edge.node;
                  const thumb = node.url || node.src || "";
                  const badge = findColourBadgeForImage(node.id);
                  return (
                    <button
                      key={node.id || idx}
                      onClick={() => { setActiveIdx(idx); requestAnimationFrame(updateDisplayMetrics); }}
                      className={`relative border border-stone-200 bg-white rounded-xl overflow-hidden w-20 h-20 flex-shrink-0 ring-1 ring-black/5 transition ${idx === activeIdx ? "outline outline-2 outline-indigo-500" : "hover:scale-[1.01]"}`}
                      title={`Image ${idx + 1}`}
                      type="button"
                    >
                      {thumb ? (
                        <img src={thumb} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-stone-200" />
                      )}
                      {badge && (
                        <div className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-1.5 py-0.5 text-[10px] text-stone-700 shadow ring-1 ring-black/10">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-stone-300"
                            style={{ backgroundColor: badge.hex }}
                            aria-hidden
                          />
                          <span className="capitalize">{badge.side}</span>
                        </div>
                      )}
                    </button>
                  );
                })}
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
                <IconAction title="Upload" onClick={uploadPendingFiles}>
                  <ArrowUpTrayIcon className="h-5 w-5" />
                  <span className="ml-1 max-w-0 opacity-0 transition-all duration-200 ease-out group-hover:max-w-[80px] group-hover:opacity-100 whitespace-nowrap text-sm">
                    Upload
                  </span>
                </IconAction>
              )}

              <IconAction title={designMode ? "Finish Design Area" : "Design Area"} onClick={() => setDesignMode((v) => !v)}>
                <PencilSquareIcon className="h-5 w-5" />
                <span className="ml-1 max-w-0 opacity-0 transition-all duration-200 ease-out group-hover:max-w-[160px] group-hover:opacity-100 whitespace-nowrap text-sm">
                  {designMode ? "Finish Design Area" : "Design Area"}
                </span>
              </IconAction>

              {/* Pending note */}
              {pendingFiles.length > 0 && (
                <span className="text-xs text-stone-600">
                  {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} ready (800×800)
                </span>
              )}
            </div>

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesChosen} />
          </div>

          {/* RIGHT: Details first (Description + Price), then Customisation */}
          <div className="space-y-5">
            {/* Description */}
            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm ring-1 ring-black/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-semibold text-stone-900">Description</h4>
                {!editingDesc && (
                  <button
                    onClick={() => { setDraftDesc(currentDesc); setEditingDesc(true); }}
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
                  {currentDesc ? <div dangerouslySetInnerHTML={{ __html: currentDesc }} /> : <p className="text-stone-600">No description</p>}
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <textarea
                    ref={descTextareaRef}
                    className="w-full min-h-[140px] bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none text-stone-800"
                    value={draftDesc}
                    onChange={(e) => setDraftDesc(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveDescription();
                      if (e.key === "Escape") { setEditingDesc(false); setDraftDesc(currentDesc); }
                    }}
                    placeholder="Enter product description (HTML allowed)"
                  />
                  <div className="flex flex-col gap-2 pt-1">
                    <button onClick={saveDescription} className="text-stone-700 hover:text-indigo-600" title="Save" type="button">
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => { setEditingDesc(false); setDraftDesc(currentDesc); }}
                      className="text-stone-700 hover:text-stone-900"
                      title="Cancel"
                      type="button"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="rounded-2xl border border-stone-200 bg-white shadow-sm ring-1 ring-black/5 p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-lg font-semibold text-stone-900">Price</h4>
                {!editingPrice && (
                  <button
                    onClick={() => { setDraftPrice(product.variants?.edges?.[0]?.node?.price ?? ""); setEditingPrice(true); }}
                    className="p-1 rounded hover:bg-stone-100"
                    title="Edit price"
                    type="button"
                  >
                    <PencilSquareIcon className="w-5 h-5 text-stone-700" />
                  </button>
                )}
              </div>

              {!editingPrice ? (
                <div className="text-stone-800 text-base">
                  ${product.variants?.edges?.[0]?.node?.price ?? "No price"}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none text-stone-800"
                    value={draftPrice}
                    onChange={(e) => setDraftPrice(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") savePrice();
                      if (e.key === "Escape") { setEditingPrice(false); setDraftPrice(product.variants?.edges?.[0]?.node?.price ?? ""); }
                    }}
                    placeholder="Enter product price"
                    min="0"
                  />
                  <button onClick={savePrice} className="text-stone-700 hover:text-indigo-600" title="Save" type="button">
                    <CheckIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setEditingPrice(false); setDraftPrice(product.variants?.edges?.[0]?.node?.price ?? ""); }}
                    className="text-stone-700 hover:text-stone-900"
                    title="Cancel"
                    type="button"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
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
                            onClick={() => setColours((prev) => [...prev, "#000000"])}
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
          </div>
        </div>

        {/* Product Details  */}
        {product.variants?.edges?.length ? (
          <div className="mx-auto max-w-7xl mt-5 rounded-2xl border border-stone-200 bg-white shadow-sm ring-1 ring-black/5 p-4 sm:p-5">
            <h4 className="text-lg font-semibold text-stone-900 mb-4">Product Details</h4>

            {/* Owner + Weight */}
            {(() => {
              const first = product.variants?.edges?.[0]?.node;
              if (!first) return null;
              return (
                <ul className="space-y-3 mb-4">
                  <li className="text-sm text-stone-700">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">Product Owner:</span>
                      {!editingProductOwner ? (
                        <span className="text-stone-800">{!productOwner || productOwner === "None@Set.test" ? "None Set" : productOwner}</span>
                      ) : (
                        <>
                          <select
                            value={productOwner}
                            onChange={(e) => setProductOwner(e.target.value)}
                            className="bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none text-stone-800"
                          >
                            <option value="">None set</option>
                            {designeremails.map((email) => (
                              <option key={email} value={email}>{email}</option>
                            ))}
                          </select>
                          <button
                            onClick={async () => { setEditingProductOwner(false); await handleSaveMetafields(); }}
                            className="text-stone-700 hover:text-indigo-600"
                            title="Save Product Owner"
                            type="button"
                          >
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setEditingProductOwner(false); setProductOwner(product.po?.value || ""); }}
                            className="text-stone-700 hover:text-stone-900"
                            title="Cancel"
                            type="button"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!editingProductOwner && currentUserRole === "admin" && (
                        <button
                          onClick={() => { setEditingProductOwner(true); setProductOwner(product.po?.value || ""); }}
                          className="p-1.5 rounded hover:bg-stone-100"
                          title="Edit Product Owner"
                          type="button"
                        >
                          <PencilSquareIcon className="w-4 h-4 text-stone-700" />
                        </button>
                      )}
                    </div>
                  </li>

                  <li className="text-sm text-stone-700">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">Weight:</span>
                      {!editingWeight ? (
                        <span className="text-stone-800">
                          {first.inventoryItem?.measurement?.weight?.value != null && first.inventoryItem?.measurement?.weight?.unit
                            ? `${first.inventoryItem.measurement.weight.value} ${String(first.inventoryItem.measurement.weight.unit).toLowerCase()}`
                            : "No weight info"}
                        </span>
                      ) : (
                        <>
                          <input
                            type="number"
                            value={draftWeight}
                            onChange={(e) => setDraftWeight(e.target.value)}
                            className="bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none text-stone-800 w-24"
                            min="0"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveWeight();
                              if (e.key === "Escape") {
                                setEditingWeight(false);
                                setDraftWeight(first.inventoryItem?.measurement?.weight?.value != null ? String(first.inventoryItem.measurement.weight.value) : "");
                              }
                            }}
                          />
                          <button onClick={saveWeight} className="text-stone-700 hover:text-indigo-600" title="Save Weight" type="button">
                            <CheckIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingWeight(false);
                              setDraftWeight(first.inventoryItem?.measurement?.weight?.value != null ? String(first.inventoryItem.measurement.weight.value) : "");
                            }}
                            className="text-stone-700 hover:text-stone-900"
                            title="Cancel"
                            type="button"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {!editingWeight && (
                        <button
                          onClick={() => setEditingWeight(true)}
                          className="p-1.5 rounded hover:bg-stone-100"
                          title="Edit Weight"
                          type="button"
                        >
                          <PencilSquareIcon className="w-4 h-4 text-stone-700" />
                        </button>
                      )}
                    </div>
                  </li>
                </ul>
              );
            })()}

            <h4 className="text-lg font-semibold text-stone-900 mb-4">Variant Details</h4>
            <ul className="space-y-3">
              {product.variants.edges.map(({ node }) => (
                <li key={node.id} className="text-sm text-stone-700">
                  <div className="font-medium text-stone-900">{node.title}</div>

                  {/* SKU */}
                  <div className="ml-4 mt-1">
                    <span className="font-semibold text-stone-900">SKU:</span>
                    {editingSkuId === node.id ? (
                      <span className="inline-flex items-center gap-2">
                        <input
                          value={draftSku}
                          onChange={(e) => setDraftSku(e.target.value)}
                          className="ml-2 bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { saveSku(); setEditingSkuId(null); }
                            if (e.key === "Escape") setEditingSkuId(null);
                          }}
                        />
                        <button onClick={() => { saveSku(); setEditingSkuId(null); }} className="text-stone-700 hover:text-indigo-600" title="Save" type="button">
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingSkuId(null)} className="text-stone-700 hover:text-stone-900" title="Cancel" type="button">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    ) : (
                      <>
                        <span className="ml-2 text-stone-800">{node.sku ?? "No SKU info"}</span>
                        <button
                          onClick={() => { setEditingSkuId(node.id); setDraftSku(node.sku ?? ""); }}
                          className="p-1.5 rounded hover:bg-stone-100 ml-1"
                          title="Edit SKU"
                          type="button"
                        >
                          <PencilSquareIcon className="w-4 h-4 text-stone-700" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Barcode */}
                  <div className="ml-4 mt-1">
                    <span className="font-semibold text-stone-900">Barcode:</span>
                    {editingBarcodeId === node.id ? (
                      <span className="inline-flex items-center gap-2">
                        <input
                          value={draftBarcode}
                          onChange={(e) => setDraftBarcode(e.target.value)}
                          className="ml-2 bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { saveBarcode(); setEditingBarcodeId(null); }
                            if (e.key === "Escape") setEditingBarcodeId(null);
                          }}
                        />
                        <button onClick={() => { saveBarcode(); setEditingBarcodeId(null); }} className="text-stone-700 hover:text-indigo-600" title="Save" type="button">
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingBarcodeId(null)} className="text-stone-700 hover:text-stone-900" title="Cancel" type="button">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    ) : (
                      <>
                        <span className="ml-2 text-stone-800">{node.barcode ?? "No barcode info"}</span>
                        <button
                          onClick={() => { setEditingBarcodeId(node.id); setDraftBarcode(node.barcode ?? ""); }}
                          className="p-1.5 rounded hover:bg-stone-100 ml-1"
                          title="Edit Barcode"
                          type="button"
                        >
                          <PencilSquareIcon className="w-4 h-4 text-stone-700" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Stock */}
                  <div className="ml-4 mt-1">
                    <span className="font-semibold text-stone-900">Stock:</span>
                    {editingStock === node.id ? (
                      <span className="inline-flex items-center gap-2">
                        <input
                          value={draftStock}
                          onChange={(e) => setDraftStock(e.target.value)}
                          className="ml-2 bg-transparent border-0 border-b border-stone-300 focus:border-indigo-500 focus:ring-0 outline-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { saveStock(); setEditingStock(null); }
                            if (e.key === "Escape") setEditingStock(null);
                          }}
                        />
                        <button onClick={() => { saveStock(); setEditingStock(null); }} className="text-stone-700 hover:text-indigo-600" title="Save" type="button">
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingStock(null)} className="text-stone-700 hover:text-stone-900" title="Cancel" type="button">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </span>
                    ) : (
                      <>
                        <span className="ml-2 text-stone-800">{node.inventoryQuantity ?? "No stock info"}</span>
                        <button
                          onClick={() => {
                            setEditingStock(node.id);
                            setDraftStock(node.inventoryQuantity != null ? String(node.inventoryQuantity) : "");
                          }}
                          className="p-1.5 rounded hover:bg-stone-100 ml-1"
                          title="Edit Stock"
                          type="button"
                        >
                          <PencilSquareIcon className="w-4 h-4 text-stone-700" />
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
