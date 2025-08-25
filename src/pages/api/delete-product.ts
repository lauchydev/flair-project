// src/pages/api/delete-product.ts
import type { NextApiRequest, NextApiResponse } from "next";

const ADMIN_API = "https://flairtester.myshopify.com/admin/api/2024-07/graphql.json";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN as string;

function safeParse(txt: string) { try { return JSON.parse(txt); } catch { return { parseError: true, body: txt }; } }

const mutation = `
  mutation productDelete($input: ProductDeleteInput!) {
    productDelete(input: $input) {
      deletedProductId
      userErrors { field message }
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");
  if (!["POST", "DELETE"].includes(req.method || "")) {
    return res.status(405).json({ message: "Method not allowed" });
  }
  if (!ADMIN_TOKEN) return res.status(500).json({ message: "Missing SHOPIFY_ADMIN_TOKEN env var" });

  // Handle body whether it's a parsed object or a raw string (DELETE bodies are flaky)
  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const id = (body as any)?.id;
  if (!id) return res.status(400).json({ message: "Missing product id" });

  try {
    const resp = await fetch(ADMIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
      body: JSON.stringify({ query: mutation, variables: { input: { id } } }),
    });

    const text = await resp.text();
    const json = safeParse(text);
    const userErrors = (json as any)?.data?.productDelete?.userErrors || [];

    if (!resp.ok || (json as any)?.errors || userErrors.length) {
      const message =
        userErrors.map((e: any) => e.message).join(", ") ||
        (json as any)?.errors?.[0]?.message ||
        resp.statusText || "Shopify delete failed";
      return res.status(400).json({ message, rawText: text });
    }

    return res.status(200).json({
      deletedProductId: (json as any)?.data?.productDelete?.deletedProductId,
    });
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || "Unexpected error" });
  }
}