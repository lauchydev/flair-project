// src/pages/api/delete-product.ts
import type { NextApiRequest, NextApiResponse } from "next";

// Shopify Admin GraphQL endpoint + private Admin API token
const ADMIN_API = "https://flairtester.myshopify.com/admin/api/2024-07/graphql.json";
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN as string;

// Helper to safely parse JSON (so we don’t crash on invalid JSON)
function safeParse(txt: string) { 
  try { 
    return JSON.parse(txt); 
  } catch { 
    return { parseError: true, body: txt }; 
  } 
}

// GraphQL mutation that deletes a product by ID
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

  // Only allow POST or DELETE requests
  if (!["POST", "DELETE"].includes(req.method || "")) {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Make sure the token is set in .env.local
  if (!ADMIN_TOKEN) {
    return res.status(500).json({ message: "Missing SHOPIFY_ADMIN_TOKEN env var" });
  }

  // Get product ID from body (handle both raw string and parsed object)
  const body = typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  const id = (body as any)?.id;
  if (!id) return res.status(400).json({ message: "Missing product id" });

  try {
    // Call Shopify Admin GraphQL API
    const resp = await fetch(ADMIN_API, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "X-Shopify-Access-Token": ADMIN_TOKEN 
      },
      body: JSON.stringify({ 
        query: mutation, 
        variables: { input: { id } } 
      }),
    });

    // Parse response (text first → safe JSON parse)
    const text = await resp.text();
    const json = safeParse(text);

    // Collect user errors (Shopify can return them even on 200 OK)
    const userErrors = (json as any)?.data?.productDelete?.userErrors || [];

    // If the request failed or Shopify returned errors, return a 400
    if (!resp.ok || (json as any)?.errors || userErrors.length) {
      const message =
        userErrors.map((e: any) => e.message).join(", ") ||
        (json as any)?.errors?.[0]?.message ||
        resp.statusText || "Shopify delete failed";

      return res.status(400).json({ message, rawText: text });
    }

    // Success → return the deleted product ID
    return res.status(200).json({
      deletedProductId: (json as any)?.data?.productDelete?.deletedProductId,
    });
  } catch (e: any) {
    // Catch unexpected runtime errors
    return res.status(500).json({ message: e?.message || "Unexpected error" });
  }
}