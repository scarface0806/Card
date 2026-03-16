import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

function sanitizeBaseName(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "file";
}

function resolveExtension(file: File) {
  const originalExtension = path.extname(file.name || "").toLowerCase();

  if (originalExtension) {
    return originalExtension;
  }

  return MIME_EXTENSION_MAP[file.type] || ".bin";
}

export async function saveUploadedImage(file: File, folder: string) {
  if (!file || file.size === 0) {
    return null;
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image uploads are supported");
  }

  const uploadsRoot = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadsRoot, { recursive: true });

  const extension = resolveExtension(file);
  const safeName = sanitizeBaseName(path.basename(file.name || "image", extension));
  const fileName = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeName}${extension}`;
  const filePath = path.join(uploadsRoot, fileName);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, fileBuffer);

  return `/uploads/${folder}/${fileName}`;
}

export async function saveUploadedImages(files: File[], folder: string) {
  const results: string[] = [];

  for (const file of files) {
    const savedPath = await saveUploadedImage(file, folder);
    if (savedPath) {
      results.push(savedPath);
    }
  }

  return results;
}