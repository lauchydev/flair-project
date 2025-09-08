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

  const { id, variantId, title, descriptionHtml, sku, barcode, inventoryQuantity, weight } = req.body as {
    id?: string;
    variantId?: string;
    title?: string;
    descriptionHtml?: string;
    sku?: string;
    barcode?: string;
    inventoryQuantity?: string | number;
    weight?: string;
  };

  if (!id) return res.status(400).json({ error: "Missing product id" });
  if (title == null && descriptionHtml == null && sku == null && barcode == null && inventoryQuantity == null && weight == null) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  // If updating variant fields, use REST Admin API
  if (sku != null || barcode != null || inventoryQuantity != null || weight != null) {
    let targetVariantId = variantId;
    if (!targetVariantId) {
      // Fetch the product to get the first variant ID
      const productResp = await fetch(`${ADMIN_API.replace('/graphql.json', '')}/products/${id}.json`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
      });
      const productJson = await productResp.json();
      targetVariantId = productJson?.product?.variants?.[0]?.id;
      if (!targetVariantId) return res.status(400).json({ error: "No variant found for product" });
    }
    // Convert GID to numeric ID for REST API
    if (typeof targetVariantId === "string" && targetVariantId.startsWith("gid://")) {
      const match = targetVariantId.match(/(\d+)$/);
      if (match) targetVariantId = match[1];
    }

    // Prepare payload for variant update
    const payload: any = { variant: { id: targetVariantId } };
    if (typeof sku === "string") payload.variant.sku = sku;
    if (typeof barcode === "string") payload.variant.barcode = barcode;
    // Do NOT send inventory_quantity in the variant payload (Shopify REST API does not allow this)
    if (typeof weight === "string") {
      const [value, unit] = weight.split(" ");
      payload.variant.weight = Number(value);
    }

    // Update the variant (SKU, barcode, weight)
    let updateResp = await fetch(`${ADMIN_API.replace('/graphql.json', '')}/variants/${targetVariantId}.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
      body: JSON.stringify(payload),
    });
    let updateText = await updateResp.text();
    let updateJson = updateText ? safeParse(updateText) : {};
    if (!updateResp.ok) {
      return res.status(400).json({ error: updateJson?.errors || "Shopify variant update failed", raw: updateJson });
    }

    // If inventoryQuantity is present, update inventory level using Inventory API
    if (typeof inventoryQuantity === "string" || typeof inventoryQuantity === "number") {
      // Get inventory_item_id from variant
      const variantResp = await fetch(`${ADMIN_API.replace('/graphql.json', '')}/variants/${targetVariantId}.json`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
      });
      const variantText = await variantResp.text();
      const variantJson = variantText ? safeParse(variantText) : {};
      const inventoryItemId = variantJson?.variant?.inventory_item_id;
      if (!inventoryItemId) {
        return res.status(400).json({ error: "No inventory_item_id found for variant" });
      }

      // Get location_id (assume first location for now)
      const locationsResp = await fetch(`${ADMIN_API.replace('/graphql.json', '')}/locations.json`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
      });
      const locationsText = await locationsResp.text();
      const locationsJson = locationsText ? safeParse(locationsText) : {};
      const locationId = locationsJson?.locations?.[0]?.id;
      if (!locationId) {
        // Log raw response to server console for debugging
        console.error("Shopify locations API raw response:", locationsText);
        return res.status(400).json({
          error: "No location_id found for shop",
          debug: {
            rawLocationsText: locationsText,
            parsedLocationsJson: locationsJson,
            status: locationsResp.status,
            statusText: locationsResp.statusText,
          }
        });
      }

      // Set inventory level
      const inventoryPayload = {
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: Number(inventoryQuantity),
      };
      const inventoryResp = await fetch(`${ADMIN_API.replace('/graphql.json', '')}/inventory_levels/set.json`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
        body: JSON.stringify(inventoryPayload),
      });
      const inventoryText = await inventoryResp.text();
      const inventoryJson = inventoryText ? safeParse(inventoryText) : {};
      if (!inventoryResp.ok) {
        // Add verbose error reporting
        return res.status(400).json({
          error: inventoryJson?.errors || "Shopify inventory update failed",
          raw: inventoryJson,
          debug: {
            request: inventoryPayload,
            responseText: inventoryText,
            status: inventoryResp.status,
            statusText: inventoryResp.statusText,
            locationId,
            inventoryItemId,
          }
        });
      }
      // Return both variant and inventory update result
      return res.status(200).json({ variant: updateJson.variant, inventory: inventoryJson });
    }
    return res.status(200).json(updateJson.variant);
  } else {
    // Only update product fields (title, description) using GraphQL
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
    const variables: Record<string, any> = { input: { id } };
    if (typeof title === "string") variables.input.title = title;
    if (typeof descriptionHtml === "string") variables.input.descriptionHtml = descriptionHtml;

    try {
      const resp = await fetch(ADMIN_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": ADMIN_TOKEN },
        body: JSON.stringify({ query: mutation, variables }),
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
}
