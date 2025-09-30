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
const asMoney = (s: string) => {
  const n = Number(s);
  if (Number.isNaN(n)) return "0.00";
  return n.toFixed(2);
};
const gidToId = (gid: string | undefined | null): string | null => {
  if (!gid) return null;
  const parts = String(gid).split("/");
  return parts[parts.length - 1] || null;
};

async function gql<T>(
  url: string,
  token: string,
  query: string,
  variables?: Record<string, any>
): Promise<{ data?: T; errors?: any; raw: any; status: number }> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const status = r.status;
  const rawText = await r.text();
  let raw: any;
  try { raw = JSON.parse(rawText); } catch { raw = { rawText }; }
  return { data: raw?.data, errors: raw?.errors, raw, status };
}

async function rest<T>(
  url: string,
  token: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: any
): Promise<{ ok: boolean; status: number; json: any; text: string }> {
  const r = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  let json: any; try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: r.ok, status: r.status, json, text };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "application/json");
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  try {
    const { title, descriptionHtml, price, sku, barcode } = (req.body || {}) as CreateBody;

    if (!title || !descriptionHtml || !price) {
      return res.status(400).json({
        ok: false,
        step: "validate",
        reason: "bad_input",
        missing: { title: !title, descriptionHtml: !descriptionHtml, price: !price },
      });
    }
    if (!isNum(price)) {
      return res.status(400).json({ ok: false, step: "validate", reason: "bad_price", hint: "Use a number-like string, e.g. '19.99'" });
    }

    const ADMIN_API = need("NEXT_PUBLIC_SHOPIFY_ADMIN_API"); 
    const TOKEN = need("SHOPIFY_ADMIN_TOKEN");
    const ADMIN_REST = ADMIN_API.replace(/\/graphql\.json$/i, "");

    const warnings: string[] = [];

    const PRODUCT_CREATE = `
      mutation CreateProduct($input: ProductInput!) {
        productCreate(input: $input) {
          product { id status title handle }
          userErrors { field message }
        }
      }
    `;
    const pc = await gql<{
      productCreate?: { product?: { id: string }, userErrors?: { field?: string[] | null, message: string }[] }
    }>(
      ADMIN_API,
      TOKEN,
      PRODUCT_CREATE,
      { input: { title, descriptionHtml, status: "ACTIVE" } }
    );
    const pcErr = pc.errors || pc.data?.productCreate?.userErrors;
    const productGid = pc.data?.productCreate?.product?.id;
    if (pcErr?.length || !productGid) {
      return res.status(400).json({ ok: false, step: "productCreate", errors: pcErr, raw: pc.raw });
    }

    const productIdNum = gidToId(productGid);
    if (!productIdNum) {
      return res.status(400).json({ ok: false, step: "parse_product_id", reason: "could_not_parse_numeric_id", gid: productGid });
    }

    const pGet = await rest<any>(`${ADMIN_REST}/products/${productIdNum}.json`, TOKEN, "GET");
    if (!pGet.ok) {
      return res.status(400).json({
        ok: false, step: "productFetchREST", status: pGet.status, error: pGet.json?.errors || pGet.text
      });
    }

    let variantIdNum: number | null = null;
    let inventoryItemIdNum: number | null = null;

    const variants: any[] = pGet.json?.product?.variants || [];
    if (variants.length > 0) {
      variantIdNum = variants[0]?.id ?? null;
      inventoryItemIdNum = variants[0]?.inventory_item_id ?? null;
    } else {
      const vCreate = await rest<any>(`${ADMIN_REST}/products/${productIdNum}/variants.json`, TOKEN, "POST", {
        variant: {
          option1: "Default Title",
        },
      });
      if (!vCreate.ok || !vCreate.json?.variant?.id) {
        return res.status(400).json({
          ok: false,
          step: "variantCreateREST",
          status: vCreate.status,
          error: vCreate.json?.errors || vCreate.text || "variant creation failed",
        });
      }
      variantIdNum = vCreate.json.variant.id;
      inventoryItemIdNum = vCreate.json.variant.inventory_item_id ?? null;
    }

    const vUpdate = await rest<any>(`${ADMIN_REST}/variants/${variantIdNum}.json`, TOKEN, "PUT", {
      variant: {
        id: variantIdNum,
        price: asMoney(price),
        ...(sku ? { sku } : {}),
        ...(barcode ? { barcode } : {}),
      },
    });
    if (!vUpdate.ok) {
      return res.status(400).json({
        ok: false,
        step: "variantUpdateREST",
        status: vUpdate.status,
        error: vUpdate.json?.errors || vUpdate.text || "variant update failed",
      });
    }

    inventoryItemIdNum = (vUpdate.json?.variant?.inventory_item_id ?? inventoryItemIdNum) || null;

    if (inventoryItemIdNum != null) {
      const invPut = await rest<any>(`${ADMIN_REST}/inventory_items/${inventoryItemIdNum}.json`, TOKEN, "PUT", {
        inventory_item: { id: inventoryItemIdNum, tracked: true },
      });
      if (!invPut.ok) {
        warnings.push(`inventoryItem.tracked not enabled (HTTP ${invPut.status}) — likely missing write_inventory.`);
      }
    } else {
      warnings.push("No inventory_item_id available to enable tracking.");
    }

    const PUBS = `
      query Pubs($first: Int!) {
        publications(first: $first) {
          edges { node { id name catalog { title } } }
        }
      }
    `;
    const pq = await gql<{ publications?: { edges: { node: { id: string; name?: string | null; catalog?: { title?: string | null } | null } }[] } }>(
      ADMIN_API, TOKEN, PUBS, { first: 100 }
    );

    if (pq.status === 200 && pq.data?.publications?.edges) {
      const pubs = pq.data.publications.edges.map(e => e.node);
      const onlineStorePub = pubs.find(n => {
        const a = (n?.name || "").toLowerCase();
        const b = (n?.catalog?.title || "").toLowerCase();
        return a.includes("online store") || b.includes("online store") || a === "online" || b === "online";
      });

      if (onlineStorePub?.id) {
        const PUBLISH = `
          mutation Pub($id: ID!, $publicationId: ID!) {
            publishablePublish(id: $id, publicationId: $publicationId) {
              userErrors { field message }
            }
          }
        `;
        const pub = await gql<{ publishablePublish?: { userErrors?: { message: string }[] } }>(
          ADMIN_API, TOKEN, PUBLISH, { id: productGid, publicationId: onlineStorePub.id }
        );
        const pubErr = pub.errors || pub.data?.publishablePublish?.userErrors;
        if (pubErr?.length) {
          warnings.push(`publishablePublish failed — likely missing publications scopes (${pubErr[0]?.message || "unknown"})`);
        }
      } else {
        warnings.push("Online Store publication not found or not accessible (likely missing read_publications).");
      }
    } else {
      warnings.push("Could not query publications (likely missing read_publications).");
    }

    return res.status(200).json({
      ok: true,
      warnings,
      product: { id: productGid, title, descriptionHtml },
      variant: {
        id: variantIdNum ? `gid://shopify/ProductVariant/${variantIdNum}` : null,
        inventoryItemId: inventoryItemIdNum ? `gid://shopify/InventoryItem/${inventoryItemIdNum}` : null,
        price: asMoney(price),
        sku,
        barcode,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, step: "server", message: e?.message || String(e) });
  }
}
