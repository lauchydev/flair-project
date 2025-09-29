import type { NextApiRequest, NextApiResponse } from "next";

const ADMIN_API = "https://flairtester.myshopify.com/admin/api/2024-07/graphql.json";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || "";

function safeParse(txt: string) {
  try {
    return JSON.parse(txt);
  } catch {
    return { parseError: true, body: txt };
  }
}

function formatDecimal(value: any): string {
  const n = parseFloat(value);
  if (Number.isFinite(n)) return n.toFixed(2);
  return "0.00";
}

type DesignArea800 = { x: number; y: number; width: number; height: number } | null;

function sanitiseDesignArea800(input: any): DesignArea800 {
  if (input == null) return null;
  const num = (v: any) => (Number.isFinite(+v) ? +v : 0);
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  const raw = { x: num(input.x), y: num(input.y), width: num(input.width), height: num(input.height) };
  const x = clamp(raw.x, 0, 800);
  const y = clamp(raw.y, 0, 800);
  const w = clamp(raw.width, 0, 800);
  const h = clamp(raw.height, 0, 800);
  if (w <= 0 || h <= 0) return null;
  return { x, y, width: Math.min(w, 800 - x), height: Math.min(h, 800 - y) };
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
    designArea,
  } = (req.body || {}) as {
    id?: string;
    customImage?: boolean;
    customText?: boolean;
    customColours?: boolean;
    colours?: string[];
    customImagePrice?: string | number;
    customTextPrice?: string | number;
    customColoursPrice?: string | number;
    productOwner?: string;
    designArea?: any;
  };

  if (!id) return res.status(200).json({ ok: false, errors: [{ message: "Missing product id" }] });

  const cleanColours: string[] = (colours || [])
    .map((v) => String(v ?? "").trim().toLowerCase())
    .filter((v) => /^#([0-9a-f]{6})$/.test(v));

  const cleanDesignArea: DesignArea800 = sanitiseDesignArea800(designArea);

  const getQuery = `
    query mf($id: ID!) {
      product(id: $id) {
        ci:   metafield(namespace: "custom", key: "custom_image") { type id }
        ct:   metafield(namespace: "custom", key: "custom_text") { type id }
        cc:   metafield(namespace: "custom", key: "color_customisation") { type id }
        ca:   metafield(namespace: "custom", key: "colours_available") { type id }
        cipv: metafield(namespace: "custom", key: "custom_image_price_variable") { type id }
        ctpv: metafield(namespace: "custom", key: "custom_text_price_variable") { type id }
        ccpv: metafield(namespace: "custom", key: "colour_customisation_price_variable") { type id }
        po:   metafield(namespace: "custom", key: "product_owner") { type id }
        da:   metafield(namespace: "custom", key: "design_area") { type id }
      }
    }
  `;

  const defsQuery = `
    query defs {
      shop {
        metafieldDefinitions(first: 100, ownerType: PRODUCT, namespace: "custom") {
          nodes { key type { name } }
        }
      }
    }
  `;

  try {
    const [getRes, defsRes] = await Promise.all([
      fetch(ADMIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
        body: JSON.stringify({ query: getQuery, variables: { id } }),
      }),
      fetch(ADMIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
        body: JSON.stringify({ query: defsQuery }),
      }),
    ]);

    const getText = await getRes.text();
    const defsText = await defsRes.text();
    const getJson = safeParse(getText);
    const defsJson = safeParse(defsText);

    if (!getRes.ok || (getJson as any)?.errors) {
      return res.status(200).json({ ok: false, errors: [{ message: "Failed to read current metafields" }], raw: getJson });
    }

    const current = (getJson as any)?.data?.product ?? {};

    let defTypeByKey: Record<string, string> = {};
    if (defsRes.ok && !(defsJson as any)?.errors) {
      const nodes: Array<{ key: string; type?: { name?: string } }> =
        (defsJson as any)?.data?.shop?.metafieldDefinitions?.nodes ?? [];
      defTypeByKey = Object.fromEntries(nodes.filter((n) => n?.key && n?.type?.name).map((n) => [n.key, String(n.type!.name!)]));
    }

    const fallbackByKey: Record<string, string> = {
      custom_image: "boolean",
      custom_text: "boolean",
      color_customisation: "boolean",
      colours_available: "list.color",
      custom_image_price_variable: "number_decimal",
      custom_text_price_variable: "number_decimal",
      colour_customisation_price_variable: "number_decimal",
      product_owner: "single_line_text_field",
      design_area: "json",
    };
    const resolveType = (key: string, instanceType?: string): string =>
      defTypeByKey[key] || instanceType || fallbackByKey[key] || "json";

    type MFInput = { ownerId: string; namespace: string; key: string; type: string; value: string };
    const inputs: MFInput[] = [];

    inputs.push({ ownerId: id, namespace: "custom", key: "custom_image", type: resolveType("custom_image", current.ci?.type), value: String(!!customImage) });
    inputs.push({ ownerId: id, namespace: "custom", key: "custom_text", type: resolveType("custom_text", current.ct?.type), value: String(!!customText) });
    inputs.push({ ownerId: id, namespace: "custom", key: "color_customisation", type: resolveType("color_customisation", current.cc?.type), value: String(!!customColours) });
    inputs.push({ ownerId: id, namespace: "custom", key: "colours_available", type: resolveType("colours_available", current.ca?.type), value: JSON.stringify(cleanColours) });
    inputs.push({ ownerId: id, namespace: "custom", key: "custom_image_price_variable", type: resolveType("custom_image_price_variable", current.cipv?.type), value: formatDecimal(customImagePrice) });
    inputs.push({ ownerId: id, namespace: "custom", key: "custom_text_price_variable", type: resolveType("custom_text_price_variable", current.ctpv?.type), value: formatDecimal(customTextPrice) });
    inputs.push({ ownerId: id, namespace: "custom", key: "colour_customisation_price_variable", type: resolveType("colour_customisation_price_variable", current.ccpv?.type), value: formatDecimal(customColoursPrice) });

    const poType = resolveType("product_owner", current.po?.type);
    if (poType === "json") {
      inputs.push({ ownerId: id, namespace: "custom", key: "product_owner", type: "json", value: JSON.stringify({ email: String(productOwner || "") }) });
    } else {
      inputs.push({ ownerId: id, namespace: "custom", key: "product_owner", type: poType, value: String(productOwner || "") });
    }

    inputs.push({ ownerId: id, namespace: "custom", key: "design_area", type: resolveType("design_area", current.da?.type), value: JSON.stringify(cleanDesignArea ?? null) });

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

    const topErrors = (setJson as any)?.errors || [];
    const result = (setJson as any)?.data?.metafieldsSet;
    const userErrors = result?.userErrors || [];

    if (topErrors.length) {
      return res.status(200).json({ ok: false, errors: [{ message: topErrors[0]?.message || "Shopify GraphQL error" }], attempted: inputs.map((i) => ({ key: i.key, type: i.type })), raw: setJson });
    }

    if (!result) {
      return res.status(200).json({ ok: false, errors: [{ message: "Unexpected Shopify response (no metafieldsSet)" }], attempted: inputs.map((i) => ({ key: i.key, type: i.type })), raw: setJson });
    }

    return res.status(200).json({ ok: userErrors.length === 0, updated: result.metafields || [], errors: userErrors.map((e: any) => ({ field: e.field, message: e.message })) });
  } catch (e: any) {
    return res.status(200).json({ ok: false, errors: [{ message: e?.message || "Failed to update metafields" }] });
  }
}
