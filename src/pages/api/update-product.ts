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

  const { id, title, descriptionHtml } = req.body as {
    id?: string;
    title?: string;
    descriptionHtml?: string; // GraphQL expects descriptionHtml (REST uses body_html)
  };

  if (!id) return res.status(400).json({ error: "Missing product id" });
  if (title == null && descriptionHtml == null) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const mutation = `
    mutation productUpdate($input: ProductInput!) {
      productUpdate(input: $input) {
        product {
          id
          title
          description
          descriptionHtml
          images(first: 20) { edges { node { id url src altText } } }
          variants(first: 10) { edges { node { id title price } } }
        }
        userErrors { field message }
      }
    }
  `;

  const input: Record<string, any> = { id };
  if (typeof title === "string") input.title = title;
  if (typeof descriptionHtml === "string") input.descriptionHtml = descriptionHtml;

  try {
    const resp = await fetch(ADMIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
      body: JSON.stringify({ query: mutation, variables: { input } }),
    });

    const text = await resp.text();
    const json = safeParse(text);

    // GraphQL-level errors (HTTP 200 but with "errors")
    if ((json as any)?.errors?.length) {
      const msg = (json as any).errors[0]?.message || "Shopify GraphQL error";
      return res.status(400).json({ error: msg, raw: json });
    }

    const result = (json as any)?.data?.productUpdate;
    const userErrors = result?.userErrors ?? [];
    if (!resp.ok || userErrors.length) {
      return res.status(400).json({
        error: userErrors[0]?.message || "Shopify update failed",
        raw: json,
      });
    }

    return res.status(200).json(result.product);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to update product" });
  }
}
