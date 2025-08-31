import type { NextApiRequest, NextApiResponse } from "next";

const SHOP_DOMAIN = "flairtester.myshopify.com";
const API_VERSION = "2024-07";
const ADMIN_GRAPHQL = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;
const ADMIN_REST = `https://${SHOP_DOMAIN}/admin/api/${API_VERSION}`;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || "";

// ---------- helpers ----------
function send(res: NextApiResponse, code: number, payload: any) {
  res.status(code).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

async function shopifyGraphQL(query: string, variables: any) {
  const r = await fetch(ADMIN_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await r.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = { nonJson: true, text }; }
  return { ok: r.ok, status: r.status, json, text };
}

function stripQuery(u?: string | null) {
  if (!u) return "";
  const i = u.indexOf("?");
  return i === -1 ? u : u.slice(0, i);
}

function gidToNumeric(gid?: string) {
  if (!gid) return null;
  const parts = gid.split("/");
  const tail = parts[parts.length - 1];
  return /^\d+$/.test(tail) ? tail : null;
}

// ---------- route ----------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
    if (!ADMIN_TOKEN) return send(res, 500, { error: "Missing SHOPIFY_ADMIN_TOKEN" });

    const body = (req.body ?? {}) as { imageId?: string; mediaId?: string; id?: string };
    const id = body.imageId || body.mediaId || body.id;
    if (!id) return send(res, 400, { error: "Missing image identifier (imageId or mediaId)" });

    const looksProductImage =
      id.startsWith("gid://shopify/ProductImage/") || id.startsWith("gid://shopify/Image/");
    const looksMediaImage = id.startsWith("gid://shopify/MediaImage/");

    // 1) Try legacy product image delete first (works for ProductImage IDs)
    if (looksProductImage || (!looksProductImage && !looksMediaImage)) {
      const q1 = `
        mutation productImageDelete($id: ID!) {
          productImageDelete(id: $id) {
            deletedImageId
            userErrors { field message }
          }
        }
      `;
      const r1 = await shopifyGraphQL(q1, { id });
      if (r1.ok && !r1.json?.errors?.length) {
        const ue = r1.json?.data?.productImageDelete?.userErrors || [];
        const deleted = r1.json?.data?.productImageDelete?.deletedImageId;
        if (!ue.length && deleted) {
          return send(res, 200, { ok: true, used: "productImageDelete", deletedImageId: deleted });
        }
      }

      // 2) Resolve the associated MediaImage by URL, then delete via productDeleteMedia
      const qResolve = `
        query resolveMediaFromProductImage($id: ID!) {
          node(id: $id) {
            __typename
            ... on ProductImage {
              id
              url
              product {
                id
                media(first: 100) {
                  nodes {
                    __typename
                    ... on MediaImage { id image { id url } }
                  }
                }
              }
            }
          }
        }
      `;
      const rResolve = await shopifyGraphQL(qResolve, { id });
      if (!rResolve.ok || rResolve.json?.errors?.length) {
        // As last resort, try GraphQL media delete directly with given id
        const qMediaFallback = `
          mutation productDeleteMedia($mediaIds: [ID!]!) {
            productDeleteMedia(mediaIds: $mediaIds) {
              deletedMediaIds
              userErrors { field message }
            }
          }
        `;
        const rMediaFallback = await shopifyGraphQL(qMediaFallback, { mediaIds: [id] });
        if (rMediaFallback.ok && !rMediaFallback.json?.errors?.length) {
          const ue = rMediaFallback.json?.data?.productDeleteMedia?.userErrors || [];
          if (!ue.length) {
            return send(res, 200, {
              ok: true,
              used: "productDeleteMedia (direct id)",
              deletedMediaIds: rMediaFallback.json?.data?.productDeleteMedia?.deletedMediaIds || [],
            });
          }
        }
        return send(res, 400, {
          error: "Failed to resolve MediaImage for deletion",
          id,
          raw: rResolve.json ?? rResolve.text,
        });
      }

      const node = rResolve.json?.data?.node;
      if (node?.__typename !== "ProductImage") {
        // Not a ProductImage; try media delete straight away
        const q2 = `
          mutation productDeleteMedia($mediaIds: [ID!]!) {
            productDeleteMedia(mediaIds: $mediaIds) {
              deletedMediaIds
              userErrors { field message }
            }
          }
        `;
        const r2 = await shopifyGraphQL(q2, { mediaIds: [id] });
        if (r2.ok && !r2.json?.errors?.length) {
          const ue = r2.json?.data?.productDeleteMedia?.userErrors || [];
          if (!ue.length) {
            return send(res, 200, {
              ok: true,
              used: "productDeleteMedia",
              deletedMediaIds: r2.json?.data?.productDeleteMedia?.deletedMediaIds || [],
            });
          }
        }
        return send(res, 400, {
          error: "Shopify deletion failed (no ProductImage node; media delete also failed)",
          used: ["productImageDelete", "productDeleteMedia"],
          id,
          raw: r2.json ?? r2.text,
        });
      }

      const productGID: string | undefined = node.product?.id;
      const legacyUrl: string = stripQuery(node.url);
      const mediaNodes: Array<any> = node.product?.media?.nodes || [];

      // Try to match by normalized URL
      const match = mediaNodes.find(
        (m) => m?.__typename === "MediaImage" && stripQuery(m?.image?.url) === legacyUrl
      );
      const mediaIdToDelete: string | undefined = match?.id;

      if (mediaIdToDelete) {
        const qDelMedia = `
          mutation productDeleteMedia($mediaIds: [ID!]!) {
            productDeleteMedia(mediaIds: $mediaIds) {
              deletedMediaIds
              userErrors { field message }
            }
          }
        `;
        const rDelMedia = await shopifyGraphQL(qDelMedia, { mediaIds: [mediaIdToDelete] });
        if (rDelMedia.ok && !rDelMedia.json?.errors?.length) {
          const ue = rDelMedia.json?.data?.productDeleteMedia?.userErrors || [];
          if (!ue.length) {
            return send(res, 200, {
              ok: true,
              used: "productDeleteMedia (resolved via URL match)",
              deletedMediaIds: rDelMedia.json?.data?.productDeleteMedia?.deletedMediaIds || [],
            });
          }
        }
        // fall through to REST as last resort
      }

      // 3) FINAL FALLBACK: REST Admin delete by numeric product + image id
      const productIdNum = gidToNumeric(productGID);
      const imageIdNum = gidToNumeric(id);
      if (productIdNum && imageIdNum) {
        const restUrl = `${ADMIN_REST}/products/${productIdNum}/images/${imageIdNum}.json`;
        const rRest = await fetch(restUrl, {
          method: "DELETE",
          headers: { "X-Shopify-Access-Token": ADMIN_TOKEN },
        });
        if (rRest.ok) {
          return send(res, 200, { ok: true, used: "REST product image delete", productIdNum, imageIdNum });
        } else {
          const t = await rRest.text();
          return send(res, 400, { error: "REST delete failed", status: rRest.status, body: t });
        }
      }

      return send(res, 400, {
        error: "Could not find matching MediaImage for this ProductImage (and REST fallback unavailable)",
        productImageId: id,
        productId: productGID,
        productImageUrl: legacyUrl,
        mediaSample: mediaNodes.slice(0, 3),
      });
    }

    // 4) If it’s already a MediaImage id, delete via media API
    if (looksMediaImage) {
      const q = `
        mutation productDeleteMedia($mediaIds: [ID!]!) {
          productDeleteMedia(mediaIds: $mediaIds) {
            deletedMediaIds
            userErrors { field message }
          }
        }
      `;
      const r = await shopifyGraphQL(q, { mediaIds: [id] });
      if (r.ok && !r.json?.errors?.length) {
        const ue = r.json?.data?.productDeleteMedia?.userErrors || [];
        if (!ue.length) {
          return send(res, 200, {
            ok: true,
            used: "productDeleteMedia",
            deletedMediaIds: r.json?.data?.productDeleteMedia?.deletedMediaIds || [],
          });
        }
        return send(res, 400, { error: ue[0]?.message || "Delete failed", used: "productDeleteMedia", id, raw: r.json });
      }
      return send(res, 400, { error: "Shopify GraphQL error", used: "productDeleteMedia", id, raw: r.json ?? r.text });
    }

    return send(res, 400, { error: "Unrecognized id format", id });
  } catch (e: any) {
    return send(res, 500, { error: e?.message || "Server error" });
  }
}
