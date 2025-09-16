import type { NextApiRequest, NextApiResponse } from "next";

const ADMIN_API = "https://flairtester.myshopify.com/admin/api/2024-07/graphql.json";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || "";

const MUTATION = `
  mutation productDelete($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors { field message }
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!ADMIN_TOKEN) {
    return res.status(500).json({ error: "Missing SHOPIFY_ADMIN_TOKEN env var" });
  }

  const { id } = req.body as { id?: string };
  if (!id) {
    return res.status(400).json({ error: "Missing product id" });
  }

  try {
    const shopifyRes = await fetch(ADMIN_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": ADMIN_TOKEN,
      },
      body: JSON.stringify({ query: MUTATION, variables: { input: { id } } }),
    });

    const text = await shopifyRes.text();
    let json: any;
    try { json = JSON.parse(text); } catch { 
      return res.status(502).json({ error: "Invalid response from Shopify", body: text });
    }

    if (!shopifyRes.ok || json?.errors) {
      const msg = json?.errors?.[0]?.message || "Shopify GraphQL error";
      return res.status(400).json({ error: msg, raw: json });
    }

    const payload = json?.data?.productDelete;
    if (!payload) {
      return res.status(400).json({ error: "Unexpected Shopify response", raw: json });
    }
    if (payload.userErrors?.length) {
      return res.status(400).json({ error: payload.userErrors[0].message, userErrors: payload.userErrors });
    }

    return res.status(200).json({ ok: true, deletedProductId: payload.deletedProductId });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Delete failed" });
  }
}
