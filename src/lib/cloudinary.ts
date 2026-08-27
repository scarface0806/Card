import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;
const cloudinaryUrl = process.env.CLOUDINARY_URL;

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    cloudinaryUrl?.startsWith("cloudinary://") ||
    (cloudName && apiKey && apiSecret)
  );
}

if (!isCloudinaryConfigured()) {
  console.warn("[Cloudinary] Missing Cloudinary environment variables. Uploads will fail until configured.");
}

cloudinary.config({
  secure: true,
  ...(cloudName && apiKey && apiSecret
    ? { cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret }
    : {}),
});

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

export const adminUploadFolders = [
  "admin/products",
  "admin/customers",
  "admin/cards",
  "admin/profiles",
  "admin/orders",
] as const;

export type AdminUploadFolder = (typeof adminUploadFolders)[number];

export function isAllowedAdminUploadFolder(folder: string): folder is AdminUploadFolder {
  return (adminUploadFolders as readonly string[]).includes(folder);
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: AdminUploadFolder | string,
  publicId?: string
): Promise<CloudinaryUploadResult> {
  if (!buffer?.length) {
    throw new Error("Empty upload buffer");
  }

  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        overwrite: Boolean(publicId),
        public_id: publicId,
      },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    stream.end(buffer);
  });
}

export default cloudinary;
