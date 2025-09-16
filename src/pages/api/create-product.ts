import type { NextApiRequest, NextApiResponse } from "next";

type CreateBody = {
  title: string;
  descriptionHtml: string;
  price: string; 
  sku?: string;
  barcode?: string;
};

const need = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env: ${k}`);
  return v.trim();
};
const isNum = (s: any) => s != null && s !== "" && !Number.isNaN(Number(s));

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  try {
    const { title, descriptionHtml, price, sku, barcode } = (req.body || {}) as CreateBody;

    if (!title || !descriptionHtml || !price) {
      return res.status(200).json({
        ok: false,
        reason: "bad_input",
        missing: { title: !title, descriptionHtml: !descriptionHtml, price: !price },
      });
    }
    if (!isNum(price)) {
      return res.status(200).json({ ok: false, reason: "bad_price", hint: "Use a number-like string, e.g. '19.99'" });
    }

    const ADMIN_API = need("NEXT_PUBLIC_SHOPIFY_ADMIN_API");
    const TOKEN = need("SHOPIFY_ADMIN_TOKEN");

    const CREATE_PRODUCT = `
      mutation CreateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product { id title handle status }
          userErrors { field message }
        }
      }
    `;
    const createVars = {
      input: {
        title,
        descriptionHtml,
      },
    };

    const r1 = await fetch(ADMIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query: CREATE_PRODUCT, variables: createVars }),
    });
    const t1 = await r1.text();
    let j1: any;
    try { j1 = JSON.parse(t1); } catch {
      return res.status(200).json({ ok: false, step: "productCreate", reason: "non_json_from_shopify", http: { status: r1.status, statusText: r1.statusText }, raw: t1.slice(0, 1500) });
    }
    if (!r1.ok) return res.status(200).json({ ok: false, step: "productCreate", reason: "transport_error", http: { status: r1.status, statusText: r1.statusText }, json: j1 });
    if (j1.errors?.length) return res.status(200).json({ ok: false, step: "productCreate", reason: "graphql_errors", errors: j1.errors });
    if (j1.data?.productCreate?.userErrors?.length) return res.status(200).json({ ok: false, step: "productCreate", reason: "user_errors", userErrors: j1.data.productCreate.userErrors });

    const product = j1.data?.productCreate?.product;
    const productId: string | undefined = product?.id;
    if (!productId) return res.status(200).json({ ok: false, step: "productCreate", reason: "no_product_id", json: j1 });

    const CREATE_VARIANT = /* GraphQL */ `
      mutation CreateVariant($productId: ID!, $input: ProductVariantInput!) {
        productVariantCreate(productId: $productId, input: $input) {
          product { id }
          productVariant { id price sku barcode }
          userErrors { field message }
        }
      }
    `;
    const variantInput: Record<string, any> = { price: String(price) };
    if (sku) variantInput.sku = sku;
    if (barcode) variantInput.barcode = barcode;

    const r2 = await fetch(ADMIN_API, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": TOKEN },
      body: JSON.stringify({ query: CREATE_VARIANT, variables: { productId, input: variantInput } }),
    });
    const t2 = await r2.text();
    let j2: any;
    try { j2 = JSON.parse(t2); } catch {
      return res.status(200).json({
        ok: false, step: "productVariantCreate", reason: "non_json_from_shopify",
        http: { status: r2.status, statusText: r2.statusText }, raw: t2.slice(0, 1500), product,
      });
    }
    if (!r2.ok) return res.status(200).json({ ok: false, step: "productVariantCreate", reason: "transport_error", http: { status: r2.status, statusText: r2.statusText }, json: j2, product });
    if (j2.errors?.length) return res.status(200).json({ ok: false, step: "productVariantCreate", reason: "graphql_errors", errors: j2.errors, product });
    if (j2.data?.productVariantCreate?.userErrors?.length) {
      return res.status(200).json({ ok: false, step: "productVariantCreate", reason: "user_errors", userErrors: j2.data.productVariantCreate.userErrors, product });
    }

    const variant = j2.data?.productVariantCreate?.productVariant;
    if (!variant?.id) {
      return res.status(200).json({ ok: false, step: "productVariantCreate", reason: "no_variant_id", json: j2, product });
    }

    return res.status(200).json({ ok: true, product, variant });
  } catch (e: any) {
    return res.status(200).json({ ok: false, reason: "server_exception", message: e?.message || String(e) });
  }
}
