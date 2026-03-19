import cloudinary from "@/lib/cloudinary";

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  if (!publicId?.trim()) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
    invalidate: true,
  });
}

export function extractCloudinaryPublicIdFromUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") {
    return null;
  }

  const marker = "/upload/";
  const uploadIndex = url.indexOf(marker);
  if (uploadIndex === -1) {
    return null;
  }

  const afterUpload = url.slice(uploadIndex + marker.length);
  const parts = afterUpload.split("/").filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  const first = parts[0] || "";
  const rest = /^v\d+$/.test(first) ? parts.slice(1) : parts;
  if (rest.length === 0) {
    return null;
  }

  const fullPath = rest.join("/");
  return fullPath.replace(/\.[^/.]+$/, "");
}
