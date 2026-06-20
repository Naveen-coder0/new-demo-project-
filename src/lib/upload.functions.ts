import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import crypto from "crypto";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "";
const API_KEY = process.env.CLOUDINARY_API_KEY ?? "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET ?? "";

/**
 * Generate a signed upload URL for the client to upload directly to Cloudinary.
 * This avoids sending the full file through our server.
 */
export const getUploadSignature = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { folder?: string }) =>
      z.object({ folder: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const timestamp = Math.round(Date.now() / 1000);
    const folder = data.folder ?? "wearbuy/products";

    const paramsToSign = `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
    const signature = crypto.createHash("sha1").update(paramsToSign).digest("hex");

    return {
      cloudName: CLOUD_NAME,
      apiKey: API_KEY,
      signature,
      timestamp,
      folder,
    };
  });

/**
 * Server-side upload for smaller images (base64). Used as fallback.
 * Accepts base64 data URL, uploads to Cloudinary, returns the secure URL.
 */
export const uploadImage = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { dataUrl: string; folder?: string }) =>
      z.object({ dataUrl: z.string(), folder: z.string().optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const folder = data.folder ?? "wearbuy/products";
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file: data.dataUrl,
        upload_preset: undefined,
        api_key: API_KEY,
        timestamp: Math.round(Date.now() / 1000),
        signature: crypto
          .createHash("sha1")
          .update(`folder=${folder}&timestamp=${Math.round(Date.now() / 1000)}${API_SECRET}`)
          .digest("hex"),
        folder,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upload failed: ${err}`);
    }

    const result = (await res.json()) as { secure_url: string; public_id: string; width: number; height: number };
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  });
