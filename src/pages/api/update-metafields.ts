import type { NextApiRequest, NextApiResponse } from "next";

const ADMIN_API = "https://flairtester.myshopify.com/admin/api/2024-07/graphql.json";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN as string;

function safeParse(txt: string) {
  try {
    return JSON.parse(txt);
  } catch {
    return { parseError: true, body: txt };
  }
}

function formatDecimal(value: any): string {
  const number = parseFloat(value);
  if (isNaN(number)) return "0.00";
  return number.toFixed(2);
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
    designArea, // now must be {x,y,width,height} or omitted
  } = req.body as {
    id?: string;
    customImage?: boolean;
    customText?: boolean;
    customColours?: boolean;
    colours?: string[];
    customImagePrice?: string;
    customTextPrice?: string;
    customColoursPrice?: string;
    designArea?: any;
  };

  if (!id) return res.status(400).json({ error: "Missing product id" });

  // Clean colours → #RRGGBB only
  const cleanColours =
    (colours || [])
      .map(String)
      .map(v => v.trim())
      .filter(v => /^#([0-9A-Fa-f]{6})$/.test(v));

  // 1) Read current metafields to get types
  const getQuery = `
    query mf($id: ID!) {
      product(id: $id) {
        ci: metafield(namespace: "custom", key: "custom_image") { type }
        ct: metafield(namespace: "custom", key: "custom_text") { type }
        cc_us: metafield(namespace: "custom", key: "color_customisation") { type }
        cc_uk: metafield(namespace: "custom", key: "colour_customisation") { type }
        ca: metafield(namespace: "custom", key: "colours_available") { type }
        cipv: metafield(namespace: "custom", key: "custom_image_price_variable") { type }
        ctpv: metafield(namespace: "custom", key: "custom_text_price_variable") { type }
        ccpv: metafield(namespace: "custom", key: "colour_customisation_price_variable") { type }
        da: metafield(namespace: "custom", key: "design_area") { type }
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
      return res
        .status(400)
        .json({ error: "Failed to read current metafields", rawText: getText, raw: getJson });
    }

    const current = (getJson as any)?.data?.product ?? {};
    const colourKey =
      current.cc_uk ? "colour_customisation" :
      current.cc_us ? "color_customisation" :
      "colour_customisation";

    const inputs: Array<{
      ownerId: string;
      namespace: string;
      key: string;
      type: string;
      value: string;
    }> = [];

    // booleans
    if (typeof customImage === "boolean") {
      inputs.push({
        ownerId: id,
        namespace: "custom",
        key: "custom_image",
        type: current.ci?.type || "boolean",
        value: String(!!customImage),
      });
    }
    if (typeof customText === "boolean") {
      inputs.push({
        ownerId: id,
        namespace: "custom",
        key: "custom_text",
        type: current.ct?.type || "boolean",
        value: String(!!customText),
      });
    }
    if (typeof customColours === "boolean") {
      inputs.push({
        ownerId: id,
        namespace: "custom",
        key: colourKey,
        type: current.cc_uk?.type || current.cc_us?.type || "boolean",
        value: String(!!customColours),
      });
    }

    // prices
    if (customImagePrice != null) {
      inputs.push({
        ownerId: id,
        namespace: "custom",
        key: "custom_image_price_variable",
        type: current.cipv?.type || "number_decimal",
        value: formatDecimal(customImagePrice),
      });
    }
    if (customTextPrice != null) {
      inputs.push({
        ownerId: id,
        namespace: "custom",
        key: "custom_text_price_variable",
        type: current.ctpv?.type || "number_decimal",
        value: formatDecimal(customTextPrice),
      });
    }
    if (customColoursPrice != null) {
      inputs.push({
        ownerId: id,
        namespace: "custom",
        key: "colour_customisation_price_variable",
        type: current.ccpv?.type || "number_decimal",
        value: formatDecimal(customColoursPrice),
      });
    }

    // colours
    if (Array.isArray(cleanColours) && cleanColours.length) {
      inputs.push({
        ownerId: id,
        namespace: "custom",
        key: "colours_available",
        type: current.ca?.type || "list.color",
        value: JSON.stringify(cleanColours),
      });
    }

    // --- DESIGN AREA: only x,y,width,height, 0..800
    if (typeof designArea !== "undefined") {
      const num = (v: any) => (Number.isFinite(+v) ? +v : NaN);
      const x = num(designArea?.x);
      const y = num(designArea?.y);
      const w = num(designArea?.width);
      const h = num(designArea?.height);

      const valid = [x, y, w, h].every(n => Number.isFinite(n));
      const clamp = (n: number) => Math.max(0, Math.min(800, n));

      if (valid && w > 0 && h > 0) {
        const rect = {
          x: clamp(x),
          y: clamp(y),
          width: clamp(w),
          height: clamp(h),
        };
        inputs.push({
          ownerId: id,
          namespace: "custom",
          key: "design_area",
          type: current.da?.type || "json",
          value: JSON.stringify(rect),
        });
      }
      // else: skip (do not send null)
    }

    if (!inputs.length) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const setMutation = `
      mutation setMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { id key namespace type value }
          userErrors { field message code }
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
      return res.status(400).json({
        error: first?.message || "Shopify GraphQL error",
        rawText: setText,
        raw: setJson,
      });
    }

    const data = (setJson as any)?.data;
    const result = data?.metafieldsSet;
    if (!setRes.ok || !result) {
      return res.status(400).json({
        error: "Unexpected Shopify response (no metafieldsSet)",
        rawText: setText,
        raw: setJson,
      });
    }

    const userErrors = result.userErrors || [];
    if (userErrors.length) {
      return res.status(400).json({
        error: userErrors[0]?.message || "Shopify update failed",
        userErrors,
        rawText: setText,
        raw: setJson,
      });
    }

    return res.status(200).json({ ok: true, metafields: result.metafields || [] });
  } catch (e: any) {
    console.error("update-metafields fatal:", e);
    return res.status(500).json({ error: e?.message || "Failed to update metafields" });
  }
}
