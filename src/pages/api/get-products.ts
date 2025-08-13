import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = `
    {
      products(first: 20) {
        edges {
          node {
            id
            title
            description
            images(first: 1) {
              edges {
                node {
                  src
                  altText
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const shopifyRes = await fetch(
      "https://flairtester.myshopify.com/admin/api/2024-07/graphql.json",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN as string,
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!shopifyRes.ok) {
      throw new Error(`Shopify API error: ${shopifyRes.statusText}`);
    }

    const data = await shopifyRes.json();
    res.status(200).json(data.data.products.edges.map((edge: any) => edge.node));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
