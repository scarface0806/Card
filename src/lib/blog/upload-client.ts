"use client";

export type UploadedImage = {
  url: string;
  publicId: string;
  width: number;
  height: number;
};

/** Every blog asset lives under one Cloudinary folder. */
export const BLOG_UPLOAD_FOLDER = "admin/blog";

/**
 * One-shot upload for images inserted inline in the editor.
 *
 * Goes through the same admin-only, signed `/api/admin/upload` route as every
 * other upload in the panel — the Cloudinary credentials stay server-side and
 * the file-type and size limits are enforced there, not here.
 */
export async function uploadBlogImage(file: File): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", BLOG_UPLOAD_FOLDER);

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Upload failed");
  }

  return {
    url: payload.url,
    publicId: payload.publicId,
    width: Number(payload.width) || 0,
    height: Number(payload.height) || 0,
  };
}
