import type { NextApiRequest, NextApiResponse } from "next";

const ADMIN_API = "https://flairtester.myshopify.com/admin/api/2024-07/graphql.json";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN as string;

function safeParse(txt: string) {
  try { return JSON.parse(txt); } catch { return { parseError: true, body: txt }; }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!ADMIN_TOKEN) return res.status(500).json({ error: "Missing SHOPIFY_ADMIN_TOKEN env var" });

  const { id, customImage, customText, customColours, colours } = req.body as {
    id?: string;
    customImage?: boolean;
    customText?: boolean;
    customColours?: boolean;
    colours?: string[];
  };

  if (!id) return res.status(400).json({ error: "Missing product id" });

  // Clean colours → #RRGGBB only
  const cleanColours =
    (colours || [])
      .map(String)
      .map(v => v.trim())
      .filter(v => /^#([0-9A-Fa-f]{6})$/.test(v));

  // 1) Read current metafields to learn their types (if they exist)
  const getQuery = `
    query mf($id: ID!) {
      product(id: $id) {
        ci: metafield(namespace: "custom", key: "custom_image") { type }
        ct: metafield(namespace: "custom", key: "custom_text") { type }
        cc: metafield(namespace: "custom", key: "color_customisation") { type }
        ca: metafield(namespace: "custom", key: "colours_available") { type }
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

    // 2) Build inputs (ALWAYS provide ownerId, namespace, key, type, value)
    const inputs = [
      {
        ownerId: id,
        namespace: "custom",
        key: "custom_image",
        type: current.ci?.type || "boolean",
        value: String(!!customImage),
      },
      {
        ownerId: id,
        namespace: "custom",
        key: "custom_text",
        type: current.ct?.type || "boolean",
        value: String(!!customText),
      },
      {
        ownerId: id,
        namespace: "custom",
        key: "color_customisation",
        type: current.cc?.type || "boolean",
        value: String(!!customColours),
      },
      {
        ownerId: id,
        namespace: "custom",
        key: "colours_available",
        type: current.ca?.type || "list.color", 
        value: JSON.stringify(cleanColours),
      },
    ];

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
      console.error("metafieldsSet GraphQL errors:", setText);
      return res.status(400).json({ error: first?.message || "Shopify GraphQL error", rawText: setText, raw: setJson });
    }

    const data = (setJson as any)?.data;
    const result = data?.metafieldsSet;
    if (!setRes.ok || !result) {
      console.error("Unexpected metafieldsSet response:", setText);
      return res.status(400).json({ error: "Unexpected Shopify response (no metafieldsSet)", rawText: setText, raw: setJson });
    }

    const userErrors = result.userErrors || [];
    if (userErrors.length) {
      console.error("metafieldsSet userErrors:", setText);
      return res.status(400).json({ error: userErrors[0]?.message || "Shopify update failed", userErrors, rawText: setText, raw: setJson });
    }

    return res.status(200).json({ ok: true, metafields: result.metafields || [] });
  } catch (e: any) {
    console.error("update-metafields fatal:", e);
    return res.status(500).json({ error: e?.message || "Failed to update metafields" });
  }
}