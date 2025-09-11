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
  // metafields
<<<<<<< HEAD
  ci?:   { id?: string | null; type: string; value: string | null }; // custom.custom_image
  ct?:   { id?: string | null; type: string; value: string | null }; // custom.custom_text
  cc?:   { id?: string | null; type: string; value: string | null }; // custom.color_customisation
  ca?:   { id?: string | null; type: string; value: string | null }; // custom.colours_available (JSON array)
  cim?:  { id?: string | null; type: string; value: string | null }; // custom.colour_image_map (JSON) (optional)
  cipv?: { id?: string | null; type: string; value: string | null }; // custom.custom_image_price_variable
  ctpv?: { id?: string | null; type: string; value: string | null }; // custom.custom_text_price_variable
  ccpv?: { id?: string | null; type: string; value: string | null }; // custom.colour_customisation_price_variable
  po?:   { id?: string | null; type: string; value: string | null }; // custom.product_owner (optional)
  da?:   { id?: string | null; type: string; value: string | null }; // custom.design_area (json: {x,y,width,height} in 0..800)
};

// Rectangle as percentages of the display box (0..1)
type RectPct = { x: number; y: number; width: number; height: number } | null;
=======
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
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)

export default function ProductDetailsPage() {
  const params = useParams() as { id: string };
  const productId = decodeURIComponent(params.id);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // Inline edit
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [editingPrice, setEditingPrice] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [editingProductOwner, setEditingProductOwner] = useState(false);

  const [editingSkuId, setEditingSkuId] = useState<string | null>(null);
  const [editingBarcodeId, setEditingBarcodeId] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<string | null>(null);

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

<<<<<<< HEAD
=======
  // Design area (absolute within 800x800)
  const [designArea, setDesignArea] = useState<RectAbs>(null);
  const [designMode, setDesignMode] = useState(false);

>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
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

  // Display box metrics for overlay + design area
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number; left: number; top: number } | null>(null);

  // Design area (stored/displayed as % of the box; converted to 0..800 on save & from 0..800 on load)
  const [designArea, setDesignArea] = useState<RectPct>(null);
  const [designMode, setDesignMode] = useState(false);
  const draggingRef = useRef<null | { startX: number; startY: number }>(null);

  const images = product?.images?.edges ?? [];
  const activeImage = images[activeIdx]?.node;

<<<<<<< HEAD
  // User context (optional, only used for productOwner editing)
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
=======
  // Container (display box) metrics
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [displaySize, setDisplaySize] = useState<{ w: number; h: number; left: number; top: number } | null>(null);

  // We still keep a ref to ensure we can remeasure on load
  const imgElRef = useRef<HTMLImageElement | null>(null);
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)

  const currentDesc = useMemo(() => {
    if (!product) return "";
    if (product.descriptionHtml && product.descriptionHtml.trim()) return product.descriptionHtml;
    return product.description || "";
  }, [product]);

<<<<<<< HEAD
=======
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

>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
  // Helpers
  function getImageById(imageId?: string | null): ImageNode | null {
    if (!imageId) return null;
    const edge = images.find((e) => e.node.id === imageId);
    return edge?.node || null;
  }

  function buildSequentialMap(cList: string[], imgEdges: { node: ImageNode }[]): ColourImageMap {
    // image order: [c0.front, c0.back, c1.front, c1.back, ...]
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

<<<<<<< HEAD
  // --- Display metrics
  function updateDisplayMetrics() {
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
      prev &&
      prev.w === next.w &&
      prev.h === next.h &&
      prev.left === next.left &&
      prev.top === next.top
        ? prev
        : next
    );
  }

  useEffect(() => {
    function onWin() { updateDisplayMetrics(); }
    window.addEventListener("resize", onWin);
    window.addEventListener("scroll", onWin, true);
    updateDisplayMetrics(); // initial
    return () => {
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
    };
  }, []);

  // --- Percent helpers & events
  function screenToPercent(clientX: number, clientY: number) {
    if (!displaySize) return null;
    const relX = clientX - displaySize.left;
    const relY = clientY - displaySize.top;
    if (relX < 0 || relY < 0 || relX > displaySize.w || relY > displaySize.h) return null;
    return {
      x: Math.max(0, Math.min(1, relX / displaySize.w)),
      y: Math.max(0, Math.min(1, relY / displaySize.h)),
    };
  }

  function clampRectPct(r: RectPct): RectPct {
    if (!r) return r;
    const clamp = (v: number) => Math.max(0, Math.min(1, v));
    const x = clamp(r.x);
    const y = clamp(r.y);
    const w = clamp(r.width);
    const h = clamp(r.height);
    return { x, y, width: Math.min(w, 1 - x), height: Math.min(h, 1 - y) };
  }

  function onDesignMouseDown(e: React.MouseEvent) {
    if (!designMode) return;
    e.preventDefault();
    draggingRef.current = { startX: e.clientX, startY: e.clientY };
    const p = screenToPercent(e.clientX, e.clientY);
    if (p) setDesignArea({ x: p.x, y: p.y, width: 0.001, height: 0.001 });
  }

  function onDesignMouseMove(e: React.MouseEvent) {
    if (!designMode || !draggingRef.current || !designArea) return;
    e.preventDefault();
    const start = draggingRef.current;
    const p1 = screenToPercent(start.startX, start.startY);
    const p2 = screenToPercent(e.clientX, e.clientY);
    if (!p1 || !p2) return;
    const x = Math.min(p1.x, p2.x);
    const y = Math.min(p1.y, p2.y);
    const w = Math.abs(p2.x - p1.x);
    const h = Math.abs(p2.y - p1.y);
    setDesignArea(clampRectPct({ x, y, width: w, height: h }));
  }

  function onDesignMouseUp() {
    if (!designMode) return;
    draggingRef.current = null;
  }

  // Convert percent rect↔absolute 0..800 rects
  function percentToAbs800(r: RectPct): { x: number; y: number; width: number; height: number } | null {
    if (!r) return null;
    const toInt = (v: number) => Math.max(0, Math.min(800, Math.round(v * 800)));
    const x = toInt(r.x);
    const y = toInt(r.y);
    const width = toInt(r.width);
    const height = toInt(r.height);
    // Ensure within bounds (avoid overflow due to rounding)
    return {
      x: Math.min(x, 800),
      y: Math.min(y, 800),
      width: Math.min(width, 800 - Math.min(x, 800)),
      height: Math.min(height, 800 - Math.min(y, 800)),
    };
  }

  function abs800ToPercent(r: any): RectPct {
    if (!r || typeof r !== "object") return null;
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
    const nx = clamp01(Number(r.x || 0) / 800);
    const ny = clamp01(Number(r.y || 0) / 800);
    const nw = clamp01(Number(r.width || 0) / 800);
    const nh = clamp01(Number(r.height || 0) / 800);
    if (nw <= 0 || nh <= 0) return null;
    return { x: nx, y: ny, width: nw, height: nh };
  }

=======
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
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
      setProductOwner(data.po?.value || "");

      // first variant defaults
      const firstVariant = data.variants?.edges?.[0]?.node;
      if (firstVariant) {
        setDraftSku(firstVariant.sku ?? "");
        setDraftBarcode(firstVariant.barcode ?? "");
        setDraftStock(firstVariant.inventoryQuantity != null ? String(firstVariant.inventoryQuantity) : "");
        const weightValue = firstVariant.inventoryItem?.measurement?.weight?.value;
        setDraftWeight(weightValue != null ? String(weightValue) : "");
      }

      // colours
<<<<<<< HEAD
=======
      let list: string[] = [];
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
      try {
        const arr = data.ca?.value ? JSON.parse(data.ca.value) : [];
        list = Array.isArray(arr) ? (arr as string[]) : [];
      } catch {
        list = [];
      }
      setColours(list);
      if (!selectedColour && list.length) setSelectedColour(list[0]);

<<<<<<< HEAD
      // colour image map (optional)
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

      try {
        const raw = data.da?.value ? JSON.parse(data.da.value) : null;
        setDesignArea(abs800ToPercent(raw));
      } catch {
        setDesignArea(null);
=======
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
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
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
  useEffect(() => { if (editingTitle) titleInputRef.current?.focus(); }, [editingTitle]);
  useEffect(() => { if (editingDesc)  descTextareaRef.current?.focus(); }, [editingDesc]);

<<<<<<< HEAD
  // Recompute sequential map when colours/images change (preserve existing ids)
=======
  // Recompute sequential map when colours/images change, but preserve existing ids
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
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
  }, [colours, images]);

  // --- Save title/description/price/etc
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
      const json = (() => { try { return JSON.parse(text); } catch { return { parseError: true, body: text }; }})();
      if (!res.ok) return alert((json as any)?.error || "Failed to update price");
      await loadProduct();
      setEditingPrice(false);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
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
      const json = (() => { try { return JSON.parse(text); } catch { return { parseError: true, body: text }; }})();
      if (!res.ok) return alert((json as any)?.error || "Failed to update title");
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
      const json = (() => { try { return JSON.parse(text); } catch { return { parseError: true, body: text }; }})();
      if (!res.ok) return alert((json as any)?.error || "Failed to update description");
      setProduct(json as Product);
      setEditingDesc(false);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }

<<<<<<< HEAD
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
      const json = (() => { try { return JSON.parse(text); } catch { return { parseError: true, body: text }; }})();
      if (!res.ok) return alert((json as any)?.error || "Failed to update SKU");
      await loadProduct();
      setEditingSkuId(null);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
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
      const json = (() => { try { return JSON.parse(text); } catch { return { parseError: true, body: text }; }})();
      if (!res.ok) return alert((json as any)?.error || "Failed to update barcode");
      await loadProduct();
      setEditingBarcodeId(null);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
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
      const json = (() => { try { return JSON.parse(text); } catch { return { parseError: true, body: text }; }})();
      if (!res.ok) return alert((json as any)?.error || "Failed to update stock");
      await loadProduct();
      setEditingStock(null);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
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
      const json = (() => { try { return JSON.parse(text); } catch { return { parseError: true, body: text }; }})();
      if (!res.ok) return alert((json as any)?.error || "Failed to update weight");
      await loadProduct();
      setEditingWeight(false);
    } catch (e: any) { alert(`Network error: ${e?.message || e}`); }
  }

  // --- Save metafields (includes designArea as ABSOLUTE 0..800 rect)
=======
  // Save metafields (includes prices + mapping + designArea as ABSOLUTE box)
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
  async function handleSaveMetafields() {
    if (!product) return;
    try {
      const abs = percentToAbs800(designArea); // convert before sending
      const res = await fetch("/api/update-metafields", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: productId,
          customImage,
          customText,
          customColours,
          colours,
          colourImageMap, // harmless if API ignores
          customImagePrice,
          customTextPrice,
          customColoursPrice,
<<<<<<< HEAD
          productOwner: productOwner === "" ? "None@Set.test" : productOwner,
          designArea: abs ?? null, // {x,y,width,height} in 0..800 | null
=======
          designArea: designArea ? { mode: "absolute_box", ...designArea } : null,
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
        }),
      });
      const text = await res.text();
      const json = (() => { try { return JSON.parse(text); } catch { return { parseError: true, body: text }; }})();
      if (!res.ok) {
        const msg =
          (json as any)?.error ||
          (json as any)?.userErrors?.[0]?.message ||
          (json as any)?.raw?.errors?.[0]?.message ||
          (json as any)?.rawText ||
          "Unknown error";
        return alert(`Save failed:\n${msg}`);
      }
      await loadProduct();
      alert("Options saved!");
    } catch (e: any) {
      alert(`Network error: ${e?.message || e}`);
    }
  }

  // Colour picking helpers
  function normalizeHexInput(value: string): string {
    // Remove any existing # and clean the input
    let v = value.replace("#", "").trim().toLowerCase();
    // Only keep valid hex characters and limit to 6 characters
    v = v.replace(/[^0-9a-f]/g, "").slice(0, 6);
    // Always return with # prefix
    return "#" + v;
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
<<<<<<< HEAD
      input.oninput = () => {
        if (input.value) setColours((prev) => Array.from(new Set([...prev, input.value])));
      };
=======
      input.oninput = () => { if (input.value) setColours((prev) => Array.from(new Set([...prev, input.value.toLowerCase()]))); };
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
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

<<<<<<< HEAD
  // Upload
  function openFilePicker() { fileInputRef.current?.click(); }
  function onFilesChosen(e: React.ChangeEvent<HTMLInputElement>) {
=======
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
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
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

<<<<<<< HEAD
  // Delete current image
  async function deleteCurrentImage() {
    const id = activeImage?.id;
=======
  // Delete
  async function deleteCurrentImage() {
    const node = activeImage;
    const id = node?.id;
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
    if (!id) { alert("This image has no id. Ensure your product query returns image { id }."); return; }
    if (!confirm("Remove this image from the product?")) return;

    setDeletingImage(true);
    try {
      const res = await fetch("/api/delete-product-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
<<<<<<< HEAD
        body: JSON.stringify({ imageId: id, productId: product?.id || "" }),
      });

      const bodyText = await res.text();
      let payload: any; try { payload = JSON.parse(bodyText); } catch { payload = { nonJson: true, body: bodyText }; }
=======
        body: JSON.stringify({
          imageId: id,
          productId: product?.id || "",
        }),
      });

      const bodyText = await res.text();
      let payload: any;
      try { payload = JSON.parse(bodyText); } catch { payload = { nonJson: true, body: bodyText }; }
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)

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

<<<<<<< HEAD

  function handleHexInputChange(
    e: React.ChangeEvent<HTMLInputElement>,
    idx: number
  ) {
    let value = e.target.value;

    // Always ensure leading "#"
    if (!value.startsWith("#")) {
      value = "#" + value.replace(/#/g, "");
    }

    // Strip invalid characters, max 6 hex digits
    const hex = value.slice(1).replace(/[^0-9a-fA-F]/g, "").slice(0, 6);

    const withHash = "#" + hex;

    setColours((prev) => prev.map((c, i) => (i === idx ? withHash : c)));
  }

  // Overlay rect in CSS pixels
=======
  // Compute overlay in container CSS pixels from ABSOLUTE 800x800 box
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
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

<<<<<<< HEAD
  // Derived display values
  const primaryUrl = activeImage?.url || activeImage?.src || null;
  const primaryAlt = activeImage?.altText || product?.title || "Product image";
=======
  // Variant weight (optional)
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
  const firstVariant = product?.variants?.edges?.[0]?.node;
  const weightValue = firstVariant?.inventoryItem?.measurement?.weight?.value;
  const weightUnit = firstVariant?.inventoryItem?.measurement?.weight?.unit;
  const weightDisplay =
    weightValue != null && weightUnit ? `${weightValue} ${String(weightUnit).toLowerCase()}` : "No weight info";
<<<<<<< HEAD

  // Render
=======

  // Add this state for local hex input values
  const [localHexValues, setLocalHexValues] = useState<{ [key: number]: string }>({});

  if (loading) return <p className="p-6">Loading...</p>;
  if (!product) return <p className="p-6">Product not found</p>;

  const primaryUrl = activeImage?.url || activeImage?.src || null;
  const primaryAlt = activeImage?.altText || product?.title || "Product image";

>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
  return (
    <div className="p-6">
      {/* Back */}
      <div className="mb-6">
        <Link href="/adminpanel" className="inline-flex items-center gap-2 text-gray-600 hover:text-black">
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Products
        </Link>
      </div>

<<<<<<< HEAD
          {/* Two-column layout */}
          <div className="flex flex-col md:flex-row gap-8">
            {/* LEFT: Image carousel + uploader */}
            <div className="flex-shrink-0 w-full md:w-[520px]">
              <div
                ref={containerRef}
                className="relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center"
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
                      className="absolute top-2 right-2 p-2 rounded bg-white/90 hover:bg-white shadow"
                      title="Delete image"
                      type="button"
                    >
                      <TrashIcon className="w-5 h-5 text-red-600" />
                    </button>

                    {designMode && (
                      <div className="absolute bottom-2 left-2 right-2 text-xs text-white bg-black/60 rounded px-2 py-1">
                        Click and drag to select the design area (saved as 0–800 coordinates).
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-gray-500">No images</div>
=======
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
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
                )}

<<<<<<< HEAD
              {/* Thumbnails */}
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {images.map((edge, idx) => {
                  const node = edge.node;
                  const thumb = node.url || node.src || "";
                  return (
                    <button
                      key={idx}
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

                <button
                  onClick={() => setDesignMode((v) => !v)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded border ${designMode ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-900"}`}
                  type="button"
                  title="Select a design area"
                >
                  <PencilSquareIcon className="w-5 h-5" />
                  {designMode ? "Finish Design Area" : "Design Area"}
                </button>

                {designArea && (
                  <>
                    <span className="text-xs text-gray-600">
                      {`{ x:${Math.round((designArea.x)*800)}, y:${Math.round((designArea.y)*800)}, w:${Math.round((designArea.width)*800)}, h:${Math.round((designArea.height)*800)} }`}
                    </span>
                    <button
                      onClick={() => setDesignArea(null)}
                      className="text-sm underline text-gray-600"
                      type="button"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* RIGHT: details + editors */}
            <div className="flex-1">
              {/* Title */}
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
=======
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
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

<<<<<<< HEAD
              {/* Description */}
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

              {/* Price */}
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
                            <div key={idx} className="flex items-center gap-2">
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
                                onChange={(e) => handleHexInputChange(e, idx)}
                                className="w-28 px-2 py-1 border rounded text-sm"
                                placeholder="#RRGGBB"
                                maxLength={7}
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

                <div className="mt-3 text-xs text-gray-600">
                  <span className="font-semibold">Design Area (saved at 0–800):</span>{" "}
                  {designArea
                    ? `{ x:${Math.round(designArea.x * 800)}, y:${Math.round(designArea.y * 800)}, w:${Math.round(designArea.width * 800)}, h:${Math.round(designArea.height * 800)} }`
                    : "None"}
                </div>
              </div>

              {/* Product Details / Per-variant editing */}
              {product.variants?.edges?.length ? (
                <div className="mt-8 p-4 border rounded">
                  <h3 className="text-xl font-semibold mb-4">Product Details</h3>
                  {(() => {
                    const first = product.variants?.edges?.[0]?.node;
                    if (!first) return null;
                    return (
                      <ul className="space-y-1 mb-4">
                        <li className="text-sm text-gray-600 mb-2">
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
                            {!editingProductOwner && currentUserRole === "admin" && (
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
                        </li>

                        <li className="text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Weight:</span>
                            {!editingWeight ? (
                              <span>{first.inventoryItem?.measurement?.weight?.value != null && first.inventoryItem?.measurement?.weight?.unit ? `${first.inventoryItem.measurement.weight.value} ${String(first.inventoryItem.measurement.weight.unit).toLowerCase()}` : "No weight info"}</span>
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
                                <button onClick={() => { setEditingWeight(false); setDraftWeight(first.inventoryItem?.measurement?.weight?.value != null ? String(first.inventoryItem.measurement.weight.value) : ""); }} className="p-2 rounded border" title="Cancel" type="button">
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
                        </li>
                      </ul>
                    );
                  })()}

                  <h4 className="text-lg font-semibold mt-2 mb-2">Stock by Variant</h4>
                  <ul className="space-y-1">
                    {product.variants.edges.map(({ node }) => (
                      <li key={node.id} className="text-sm text-gray-600">
                        <div><span className="font-semibold">{node.title}</span></div>

                        {/* SKU */}
                        <div className="ml-4">
                          <span className="font-semibold">SKU:</span>
                          {editingSkuId === node.id ? (
                            <>
                              <input
                                value={draftSku}
                                onChange={e => setDraftSku(e.target.value)}
                                className="border rounded px-2 py-1 ml-2"
                              />
                              <button
                                onClick={async () => {
                                  await saveSku();
                                  setEditingSkuId(null);
                                }}
                                className="p-2 rounded bg-black text-white ml-1"
                                title="Save SKU"
                                type="button"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingSkuId(null)}
                                className="p-2 rounded border ml-1"
                                title="Cancel"
                                type="button"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="ml-2">{node.sku ?? "No SKU info"}</span>
                              <button
                                onClick={() => { setEditingSkuId(node.id); setDraftSku(node.sku ?? ""); }}
                                className="p-2 rounded hover:bg-gray-100 ml-1"
                                title="Edit SKU"
                                type="button"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Barcode */}
                        <div className="ml-4">
                          <span className="font-semibold">Barcode:</span>
                          {editingBarcodeId === node.id ? (
                            <>
                              <input
                                value={draftBarcode}
                                onChange={e => setDraftBarcode(e.target.value)}
                                className="border rounded px-2 py-1 ml-2"
                              />
                              <button
                                onClick={async () => {
                                  await saveBarcode();
                                  setEditingBarcodeId(null);
                                }}
                                className="p-2 rounded bg-black text-white ml-1"
                                title="Save Barcode"
                                type="button"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingBarcodeId(null)}
                                className="p-2 rounded border ml-1"
                                title="Cancel"
                                type="button"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="ml-2">{node.barcode ?? "No barcode info"}</span>
                              <button
                                onClick={() => { setEditingBarcodeId(node.id); setDraftBarcode(node.barcode ?? ""); }}
                                className="p-2 rounded hover:bg-gray-100 ml-1"
                                title="Edit Barcode"
                                type="button"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>

                        {/* Stock */}
                        <div className="ml-4">
                          <span className="font-semibold">Stock:</span>
                          {editingStock === node.id ? (
                            <>
                              <input
                                value={draftStock}
                                onChange={e => setDraftStock(e.target.value)}
                                className="border rounded px-2 py-1 ml-2"
                              />
                              <button
                                onClick={async () => {
                                  await saveStock();
                                  setEditingStock(null);
                                }}
                                className="p-2 rounded bg-black text-white ml-1"
                                title="Save Stock"
                                type="button"
                              >
                                <CheckIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingStock(null)}
                                className="p-2 rounded border ml-1"
                                title="Cancel"
                                type="button"
                              >
                                <XMarkIcon className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="ml-2">{node.inventoryQuantity ?? "No stock info"}</span>
                              <button
                                onClick={() => {
                                  setEditingStock(node.id);
                                  setDraftStock(node.inventoryQuantity != null ? String(node.inventoryQuantity) : "");
                                }}
                                className="p-2 rounded hover:bg-gray-100 ml-1"
                                title="Edit Stock"
                                type="button"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
=======
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
                            value={localHexValues[idx] !== undefined ? localHexValues[idx] : hex}
                            onChange={(e) => {
                              const inputValue = e.target.value;
                              let newValue = inputValue;
                              
                              // Always ensure # is at the beginning
                              if (!newValue.startsWith("#")) {
                                newValue = "#" + newValue;
                              }
                              
                              // Only allow hex characters after #
                              newValue = newValue.replace(/[^#0-9a-fA-F]/g, "");
                              
                              // Limit to 7 characters total (# + 6 hex)
                              if (newValue.length > 7) {
                                newValue = newValue.slice(0, 7);
                              }
                              
                              // Update local state
                              setLocalHexValues(prev => ({ ...prev, [idx]: newValue }));
                            }}
                            onKeyDown={(e) => {
                              // Prevent backspace from removing the #
                              if (e.key === "Backspace" && e.currentTarget.value === "#") {
                                e.preventDefault();
                              }
                            }}
                            onBlur={() => {
                              // Normalize and update the main state when losing focus
                              const currentValue = localHexValues[idx] !== undefined ? localHexValues[idx] : hex;
                              const normalized = normalizeHexInput(currentValue);
                              setColours((prev) => prev.map((c, i) => (i === idx ? normalized : c)));
                              // Clear local state
                              setLocalHexValues(prev => {
                                const newState = { ...prev };
                                delete newState[idx];
                                return newState;
                              });
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
>>>>>>> e3c9509 (Create Designer Account + Add Design Area)
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
