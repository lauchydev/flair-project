import type { NextApiRequest, NextApiResponse } from "next";
import formidable, {
  type Fields,
  type Files,
  type File as FormidableFile,
} from "formidable";
import fs from "fs";

// Next must not parse the body for file uploads
export const config = { api: { bodyParser: false } };

const SHOP_DOMAIN = "flairtester.myshopify.com";
const ADMIN_API = `https://${SHOP_DOMAIN}/admin/api/2024-07/graphql.json`;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN as string;

function gqlFetch(query: string, variables: Record<string, any>) {
  return fetch(ADMIN_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": ADMIN_TOKEN || "",
    },
    body: JSON.stringify({ query, variables }),
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!ADMIN_TOKEN) return res.status(500).json({ error: "Missing SHOPIFY_ADMIN_TOKEN env var" });

  const form = formidable({ multiples: true });

  form.parse(req, async (err: unknown, fields: Fields, files: Files) => {
    if (err) return res.status(400).json({ error: "Failed to parse form data" });

    // --- Normalize productId (can be GID, numeric, or handle)
    const rawField = fields["productId"];
    let productIdInput = "";

    if (Array.isArray(rawField)) {
      productIdInput = String(rawField[0] ?? "");
    } else if (typeof rawField === "string") {
      productIdInput = rawField;
    } else if (rawField != null) {
      // Some form parsers can give numbers/booleans here; coerce safely
      productIdInput = String(rawField as unknown);
    }

    productIdInput = productIdInput.trim();
    if (!productIdInput) {
      return res.status(400).json({ error: "Missing productId" });
    }

    let productIdGID = productIdInput;

    // If numeric ID, convert to GID
    if (/^\d+$/.test(productIdGID)) {
      productIdGID = `gid://shopify/Product/${productIdGID}`;
    }

    // If not a GID, try to resolve by handle via Admin API
    if (!productIdGID.startsWith("gid://shopify/Product/")) {
      const resolveQuery = `
        query resolveProductByHandle($query: String!) {
          products(first: 1, query: $query) {
            edges { node { id handle title } }
          }
        }
      `;
      const resolveResp = await gqlFetch(resolveQuery, { query: `handle:${productIdGID}` });
      const resolveJson = await resolveResp.json();
      const foundId: string | undefined = resolveJson?.data?.products?.edges?.[0]?.node?.id;
      if (!foundId) {
        return res.status(400).json({
          error: "Could not resolve productId; pass a GID, numeric id, or valid handle",
          received: productIdInput,
        });
      }
      productIdGID = foundId;
    }

    // --- Collect files under the input name "files"
    const filesMap = files as Record<string, FormidableFile | FormidableFile[] | undefined>;
    const rawFiles = filesMap["files"];
    const fileList: FormidableFile[] = Array.isArray(rawFiles) ? rawFiles : rawFiles ? [rawFiles] : [];
    if (!fileList.length) return res.status(400).json({ error: "No files provided" });

    try {
      // 1) Get staging targets (one per file)
      const stagedInputs = fileList.map((f) => ({
        resource: "IMAGE",
        filename: f.originalFilename || "upload.jpg",
        mimeType: f.mimetype || "image/jpeg",
        httpMethod: "POST",
      }));

      const stagedQuery = `
        mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              url
              resourceUrl
              parameters { name value }
            }
            userErrors { field message }
          }
        }
      `;

      const stagedResp = await gqlFetch(stagedQuery, { input: stagedInputs });
      const stagedJson = await stagedResp.json();

      if (stagedJson?.errors?.length) {
        return res.status(400).json({
          error: stagedJson.errors[0]?.message || "GraphQL error",
          raw: stagedJson,
        });
      }

      const targets: Array<{
        url: string;
        resourceUrl: string;
        parameters: { name: string; value: string }[];
      }> = stagedJson?.data?.stagedUploadsCreate?.stagedTargets || [];

      const stagedErrs = stagedJson?.data?.stagedUploadsCreate?.userErrors || [];
      if (stagedErrs.length) {
        return res.status(400).json({
          error: stagedErrs[0]?.message || "stagedUploadsCreate failed",
          raw: stagedErrs,
        });
      }

      if (targets.length !== fileList.length) {
        return res.status(400).json({ error: "Mismatch between files and staged targets" });
      }

      // 2) Upload each file to S3 using the form fields Shopify provided
      const uploadedResourceUrls: string[] = [];
      for (let i = 0; i < fileList.length; i++) {
        const f = fileList[i];
        const t = targets[i];

        const fileBuffer = fs.readFileSync(f.filepath);
        const formData = new FormData();

        // Required parameters first
        t.parameters.forEach((p) => formData.append(p.name, p.value));
        // The file must be appended as the last part named "file"
        formData.append(
          "file",
          new Blob([fileBuffer]),
          f.originalFilename || "upload.jpg"
        );

        const s3Resp = await fetch(t.url, { method: "POST", body: formData });
        if (!s3Resp.ok) {
          const errTxt = await s3Resp.text();
          return res.status(400).json({ error: "S3 upload failed", details: errTxt });
        }

        uploadedResourceUrls.push(t.resourceUrl);
      }

      // 3) Attach uploaded images to the product
      const mediaMutation = `
        mutation productCreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
          productCreateMedia(productId: $productId, media: $media) {
            media {
              ... on MediaImage {
                id
                alt
                image { id url }
              }
            }
            mediaUserErrors { field message }
          }
        }
      `;

      const mediaInputs = uploadedResourceUrls.map((u, idx) => ({
        alt: fileList[idx].originalFilename || "",
        mediaContentType: "IMAGE",
        originalSource: u,
      }));

      const mediaResp = await gqlFetch(mediaMutation, {
        productId: productIdGID,
        media: mediaInputs,
      });
      const mediaJson = await mediaResp.json();

      if (mediaJson?.errors?.length) {
        return res.status(400).json({
          error: mediaJson.errors[0]?.message || "GraphQL error",
          raw: mediaJson,
        });
      }

      const mErrs = mediaJson?.data?.productCreateMedia?.mediaUserErrors || [];
      if (mErrs.length) {
        return res.status(400).json({
          error: mErrs[0]?.message || "productCreateMedia failed",
          raw: mediaJson,
        });
      }

      const created = mediaJson?.data?.productCreateMedia?.media || [];
      return res.status(200).json({ ok: true, media: created });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || "Upload failed" });
    }
  });
}
