"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useImageUpload } from "@/hooks/useImageUpload";

type AspectRatio = "square" | "landscape" | "portrait";

type ImageUploadProps = {
  folder: string;
  /**
   * The third argument is additive: existing callers that take two
   * parameters keep working untouched, while a caller that renders the image
   * through next/image can read the stored dimensions from it.
   */
  onUploadComplete: (
    url: string,
    publicId: string,
    meta?: { width: number | null; height: number | null }
  ) => void;
  currentImageUrl?: string;
  label?: string;
  aspectRatio?: AspectRatio;
};

const aspectRatioClassMap: Record<AspectRatio, string> = {
  square: "aspect-square",
  landscape: "aspect-video",
  portrait: "aspect-[3/4]",
};

export default function ImageUpload({
  folder,
  onUploadComplete,
  currentImageUrl,
  label = "Image",
  aspectRatio = "landscape",
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(currentImageUrl || null);

  const {
    imageUrl,
    publicId,
    width,
    height,
    isUploading,
    uploadProgress,
    error,
    handleFileSelect,
    resetImage,
  } = useImageUpload(folder);

  useEffect(() => {
    setLocalPreview(currentImageUrl || null);
  }, [currentImageUrl]);

  useEffect(() => {
    if (imageUrl && publicId) {
      setLocalPreview(imageUrl);
      onUploadComplete(imageUrl, publicId, { width, height });
    }
  }, [imageUrl, publicId, width, height, onUploadComplete]);

  const dropZoneClass = useMemo(() => {
    const base = "rounded-xl border border-dashed p-4 transition-all";
    const accent = isDragOver
      ? "border-[rgba(76,174,137,0.30)] bg-[rgba(76,174,137,0.10)]"
      : "border-[rgba(241,243,241,0.18)] bg-[rgba(7,10,9,0.55)] hover:border-[rgba(76,174,137,0.40)]";
    return `${base} ${accent}`;
  }, [isDragOver]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const onFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }

    const objectUrl = URL.createObjectURL(selected);
    setLocalPreview(objectUrl);
    await handleFileSelect(selected);
  };

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const dropped = event.dataTransfer.files?.[0];
    if (!dropped) {
      return;
    }

    const objectUrl = URL.createObjectURL(dropped);
    setLocalPreview(objectUrl);
    await handleFileSelect(dropped);
  };

  const removeImage = () => {
    resetImage();
    setLocalPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-[var(--tv-text)]">{label}</p>

      <div
        className={dropZoneClass}
        onDrop={onDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        {localPreview ? (
          <div className="space-y-3">
            <div className={`overflow-hidden rounded-lg border border-[var(--tv-rule)] bg-[var(--tv-graphite)] ${aspectRatioClassMap[aspectRatio]}`}>
              <img src={localPreview} alt="Uploaded" className="h-full w-full object-cover" />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openFilePicker}
                disabled={isUploading}
                className="inline-flex items-center gap-2 rounded-lg border border-[rgba(241,243,241,0.18)] px-3 py-2 text-xs text-[var(--tv-text)] hover:bg-[rgba(241,243,241,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ImagePlus className="h-3.5 w-3.5" />
                Replace
              </button>
              <button
                type="button"
                onClick={removeImage}
                disabled={isUploading}
                className="inline-flex items-center gap-2 rounded-lg border border-[rgba(224,122,110,0.40)] px-3 py-2 text-xs text-[var(--tv-danger)] hover:bg-[rgba(224,122,110,0.10)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openFilePicker}
            disabled={isUploading}
            className="flex w-full flex-col items-center justify-center gap-2 py-8 text-center text-sm text-[var(--tv-text)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <UploadCloud className="h-6 w-6 text-[var(--tv-patina)]" />
            <span>Drag and drop an image here, or click to select</span>
            <span className="text-xs text-[var(--tv-text-muted)]">JPG, PNG, WEBP, GIF up to 5MB</span>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onFileInputChange}
          className="hidden"
        />
      </div>

      {isUploading ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-[var(--tv-text)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading... {uploadProgress}%
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(241,243,241,0.06)]">
            <div
              className="h-full rounded-full bg-[var(--tv-brass)] transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-[var(--tv-danger)]">{error}</p> : null}
    </div>
  );
}
