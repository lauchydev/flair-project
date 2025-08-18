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

  const { variants } = req.body as {
    variants?: { id: string; weight: number; weightUnit?: string }[];
  };

  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return res.status(400).json({ error: "No variants provided" });
  }

  // Build mutation string
  const mutation = `
    mutation UpdateVariantWeight($input: ProductVariantInput!) {
      productVariantUpdate(input: $input) {
        productVariant {
          id
          weight
          weightUnit
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const results = [];

  for (const variant of variants) {
    const input = {
      id: variant.id,
      weight: parseFloat(variant.weight as any),
      weightUnit: variant.weightUnit || "KILOGRAMS",
    };

    const graphqlBody = JSON.stringify({
      query: mutation,
      variables: { input },
    });

    try {
      const resData = await fetch(ADMIN_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": ADMIN_TOKEN,
        },
        body: graphqlBody,
      });

      const text = await resData.text();
      const json = safeParse(text);

      if (!resData.ok || json?.errors) {
        results.push({ success: false, id: variant.id, error: json?.errors?.[0]?.message || "GraphQL error", raw: json });
        continue;
      }

      const result = json?.data?.productVariantUpdate;

      if (result?.userErrors?.length) {
        results.push({ success: false, id: variant.id, error: result.userErrors[0].message });
        continue;
      }

      results.push({ success: true, variant: result.productVariant });
    } catch (err: any) {
      results.push({ success: false, id: variant.id, error: err.message });
    }
  }

  return res.status(200).json({ results });
}