import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.warn("[Cloudinary] Missing Cloudinary environment variables. Uploads will fail until configured.");
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
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
