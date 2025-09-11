import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing or invalid product ID" });
  }

  const query = `
    query getProduct($id: ID!) {
      product(id: $id) {
        id
        title
        description
        descriptionHtml
        images(first: 20) { edges { node {id url src altText } } }
        variants(first: 10) { edges { node { id title price sku barcode inventoryQuantity inventoryItem { measurement { weight { value unit } } } } } }
        ci: metafield(namespace: "custom", key: "custom_image") { id namespace key type value }
        ct: metafield(namespace: "custom", key: "custom_text") { id namespace key type value }
        cc: metafield(namespace: "custom", key: "color_customisation") { id namespace key type value }
        ca: metafield(namespace: "custom", key: "colours_available") { id namespace key type value }
        cipv: metafield(namespace: "custom", key: "custom_image_price_variable") { id namespace key type value }
        ctpv: metafield(namespace: "custom", key: "custom_text_price_variable") { id namespace key type value }
        ccpv: metafield(namespace: "custom", key: "colour_customisation_price_variable") { id namespace key type value }
        po: metafield(namespace: "custom", key: "product_owner") { id namespace key type value }
      }
    }
  `;

  try {
    const response = await fetch(
      "https://flairtester.myshopify.com/admin/api/2024-07/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN as string,
        },
        body: JSON.stringify({ query, variables: { id } }),
      }
    );

    const json = await response.json();
    console.log("Shopify response:", JSON.stringify(json, null, 2)); // Debug log

    if (!response.ok || json.errors) {
      console.error("Shopify GraphQL error:", json.errors || json);
      return res.status(500).json({ error: "Shopify error", details: json.errors || json });
    }

    if (!json.data || !json.data.product) {
      return res.status(404).json({ error: "Product not found" });
    }

    return res.status(200).json(json.data.product);
  } catch (error: any) {
    console.error("API Fetch Error:", error);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
}