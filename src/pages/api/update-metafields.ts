import type { NextApiRequest, NextApiResponse } from "next";

const ADMIN_API = "https://flairtester.myshopify.com/admin/api/2024-07/graphql.json";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || "";

function safeParse(txt: string) {
  try { return JSON.parse(txt); } catch { return { parseError: true, body: txt }; }
}

function formatDecimal(value: any): string {
  const n = parseFloat(value);
  if (isNaN(n)) return "0.00";
  return n.toFixed(2);
}

// ---- NEW: types + sanitiser for 0..800 pixel box ----
type DesignArea800 = { x: number; y: number; width: number; height: number } | null;

function sanitiseDesignArea800(input: any): DesignArea800 {
  if (input == null) return null; // allow clearing
  const num = (v: any) => (Number.isFinite(+v) ? +v : 0);
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const raw = {
    x: num(input.x),
    y: num(input.y),
    width: num(input.width),
    height: num(input.height),
  };

  // clamp position/size into 0..800 and keep box within bounds
  const x = clamp(raw.x, 0, 800);
  const y = clamp(raw.y, 0, 800);
  const w = clamp(raw.width, 0, 800);
  const h = clamp(raw.height, 0, 800);

  if (w <= 0 || h <= 0) return null;

  // ensure it doesn't overflow the 800×800 boundary
  const width = Math.min(w, 800 - x);
  const height = Math.min(h, 800 - y);

  return { x, y, width, height };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!ADMIN_TOKEN) return res.status(500).json({ error: "Missing SHOPIFY_ADMIN_TOKEN env var" });

  const {
    id,
    customImage,
    customText,
    customColours,
    colours,
    customImagePrice,
    customTextPrice,
    customColoursPrice,
    productOwner,
    // ---- NEW: accept designArea from client (already scaled to 0..800) ----
    designArea,
  } = req.body as {
    id?: string;
    customImage?: boolean;
    customText?: boolean;
    customColours?: boolean;
    colours?: string[];
    customImagePrice?: string;
    customTextPrice?: string;
    customColoursPrice?: string;
    productOwner?: string;
    designArea?: any; // validated below
  };

  if (!id) return res.status(400).json({ error: "Missing product id" });

  // Clean colours → #RRGGBB
  const cleanColours: string[] = (colours || [])
    .map((v) => String(v ?? "").trim())
    .filter((v) => /^#([0-9A-Fa-f]{6})$/.test(v));

  // ---- NEW: sanitise to 0..800 box or null ----
  const cleanDesignArea: DesignArea800 = sanitiseDesignArea800(designArea);

  // 1) Read current metafields to learn their types (if they exist)
  const getQuery = `
    query mf($id: ID!) {
      product(id: $id) {
        ci: metafield(namespace: "custom", key: "custom_image") { type }
        ct: metafield(namespace: "custom", key: "custom_text") { type }
        cc: metafield(namespace: "custom", key: "color_customisation") { type }
        ca: metafield(namespace: "custom", key: "colours_available") { type }
        cipv: metafield(namespace: "custom", key: "custom_image_price_variable") { type }
        ctpv: metafield(namespace: "custom", key: "custom_text_price_variable") { type }
        ccpv: metafield(namespace: "custom", key: "colour_customisation_price_variable") { type }
        po: metafield(namespace: "custom", key: "product_owner") { type }
        da: metafield(namespace: "custom", key: "design_area") { type }  # <-- NEW
      }
    }
  `;

  try {
    const getRes = await fetch(ADMIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
      body: JSON.stringify({ query: getQuery, variables: { id } }),
    });

    const getText = await getRes.text();
    const getJson = safeParse(getText);

    if (!getRes.ok || (getJson as any)?.errors) {
      return res.status(400).json({ error: "Failed to read current metafields", rawText: getText, raw: getJson });
    }

    const current = (getJson as any)?.data?.product ?? {};

    // 2) Build inputs
    const inputs: Array<{ ownerId: string; namespace: string; key: string; type: string; value: string }> = [
      { ownerId: id, namespace: "custom", key: "custom_image", type: current.ci?.type || "boolean", value: String(!!customImage) },
      { ownerId: id, namespace: "custom", key: "custom_text", type: current.ct?.type || "boolean", value: String(!!customText) },
      { ownerId: id, namespace: "custom", key: "color_customisation", type: current.cc?.type || "boolean", value: String(!!customColours) },
      { ownerId: id, namespace: "custom", key: "colours_available", type: current.ca?.type || "list.color", value: JSON.stringify(cleanColours) },
      { ownerId: id, namespace: "custom", key: "custom_image_price_variable", type: current.cipv?.type || "number_decimal", value: formatDecimal(customImagePrice) },
      { ownerId: id, namespace: "custom", key: "custom_text_price_variable", type: current.ctpv?.type || "number_decimal", value: formatDecimal(customTextPrice) },
      { ownerId: id, namespace: "custom", key: "colour_customisation_price_variable", type: current.ccpv?.type || "number_decimal", value: formatDecimal(customColoursPrice) },
      { ownerId: id, namespace: "custom", key: "product_owner", type: current.po?.type || "single_line_text_field", value: productOwner || "" },
    ];

    // ---- NEW: push design_area as JSON with 0..800 values (or null to clear) ----
    inputs.push({
      ownerId: id,
      namespace: "custom",
      key: "design_area",
      type: current.da?.type || "json",
      value: JSON.stringify(cleanDesignArea ?? null),
    });

    const setMutation = `
      mutation setMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id key namespace type value }
          userErrors { field message }
        }
      }
    `;

    const setRes = await fetch(ADMIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
      body: JSON.stringify({ query: setMutation, variables: { metafields: inputs } }),
    });

    const setText = await setRes.text();
    const setJson = safeParse(setText);

    if ((setJson as any)?.errors?.length) {
      const first = (setJson as any).errors?.[0];
      return res.status(400).json({ error: first?.message || "Shopify GraphQL error", rawText: setText, raw: setJson });
    }

    const result = (setJson as any)?.data?.metafieldsSet;
    if (!setRes.ok || !result) {
      return res.status(400).json({ error: "Unexpected Shopify response (no metafieldsSet)", rawText: setText, raw: setJson });
    }

    const userErrors = result.userErrors || [];
    if (userErrors.length) {
      return res.status(400).json({ error: userErrors[0]?.message || "Shopify update failed", userErrors, rawText: setText, raw: setJson });
    }

    return res.status(200).json({ ok: true, metafields: result.metafields || [] });
  } catch (e: any) {
    console.error("update-metafields fatal:", e);
    return res.status(500).json({ error: e?.message || "Failed to update metafields" });
  }
}
