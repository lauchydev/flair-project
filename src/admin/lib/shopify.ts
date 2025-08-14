export async function fetchProducts() {
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

  const res = await fetch(process.env.NEXT_PUBLIC_SHOPIFY_ADMIN_API as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN as string,
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`Shopify API request failed: ${res.statusText}`);

  const data = await res.json();
  return data.data.products.edges.map((edge: any) => edge.node);
}
