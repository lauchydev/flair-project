import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store");

  const { id } = req.query;
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Missing product ID" });
  }

  const query = `
    query getProduct($id: ID!) {
      product(id: $id) {
        id
        title
        description
        descriptionHtml
        images(first: 5) { edges { node { url src altText } } }
        variants(first: 10) { edges { node { id title price } } }

        # Your metafields (namespace: custom)
        ci: metafield(namespace: "custom", key: "custom_image") {
          id namespace key type value
        }
        ct: metafield(namespace: "custom", key: "custom_text") {
          id namespace key type value
        }
        cc: metafield(namespace: "custom", key: "color_customisation") {
          id namespace key type value
        }
        ca: metafield(namespace: "custom", key: "colours_available") {
          id namespace key type value
        }
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
    if (!response.ok) {
      return res.status(500).json({ error: `Shopify error: ${response.statusText}` });
    }

    return res.status(200).json(json.data.product);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch product" });
  }
}
