"use client";

import { useState } from "react";

type UploadSuccessResponse = {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
};

export type UseImageUploadReturn = {
  imageUrl: string | null;
  publicId: string | null;
  // Stored dimensions, reported by Cloudinary. Callers rendering through
  // next/image need them to reserve layout space; the rest can ignore them.
  width: number | null;
  height: number | null;
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  handleFileSelect: (file: File) => Promise<void>;
  resetImage: () => void;
};

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export function useImageUpload(folder: string): UseImageUploadReturn {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [publicId, setPublicId] = useState<string | null>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [height, setHeight] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const resetImage = () => {
    setImageUrl(null);
    setPublicId(null);
    setWidth(null);
    setHeight(null);
    setUploadProgress(0);
    setError(null);
  };

  const handleFileSelect = async (file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.has(file.type)) {
      setError("Unsupported file type. Use JPEG, PNG, WEBP, or GIF.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError("File too large. Max size is 5MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await new Promise<UploadSuccessResponse>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState !== XMLHttpRequest.DONE) {
            return;
          }

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const parsed = JSON.parse(xhr.responseText) as UploadSuccessResponse;
              resolve(parsed);
            } catch {
              reject(new Error("Invalid upload response"));
            }
            return;
          }

          try {
            const parsed = JSON.parse(xhr.responseText) as { error?: string };
            reject(new Error(parsed.error || "Upload failed"));
          } catch {
            reject(new Error("Upload failed"));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));

        xhr.open("POST", "/api/admin/upload");
        xhr.send(formData);
      });

      setImageUrl(response.url);
      setPublicId(response.publicId);
      setWidth(response.width ?? null);
      setHeight(response.height ?? null);
      setUploadProgress(100);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Upload failed");
      setImageUrl(null);
      setPublicId(null);
      setWidth(null);
      setHeight(null);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  return {
    imageUrl,
    publicId,
    width,
    height,
    isUploading,
    uploadProgress,
    error,
    handleFileSelect,
    resetImage,
  };
}
