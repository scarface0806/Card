"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImageOff, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
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
  /** Alt text for the preview. Omitted = decorative (""), never "Uploaded". */
  alt?: string;
  /**
   * Called after the uploader's own Remove has cleared its preview, so the
   * caller can clear what it saved. Optional: callers without it keep working.
   */
  onRemove?: () => void;
};

const aspectRatioClassMap: Record<AspectRatio, string> = {
  square: "aspect-square",
  landscape: "aspect-video",
  portrait: "aspect-[3/4]",
};

/**
 * A preview never takes over the page: it was aspect-video at full panel
 * width (~870x490). Portrait product shots get a narrower cap so a vertical
 * card is not taller than the screen.
 */
const maxWidthClassMap: Record<AspectRatio, string> = {
  square: "max-w-[320px]",
  landscape: "max-w-[560px]",
  portrait: "max-w-[280px]",
};

const HINT = "JPG, PNG, WEBP, GIF up to 5MB";

export default function ImageUpload({
  folder,
  onUploadComplete,
  currentImageUrl,
  label = "Image",
  aspectRatio = "landscape",
  alt,
  onRemove,
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(currentImageUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);
  // The src that failed to load. Comparing against the current src (rather
  // than a boolean) resets the fallback by itself whenever the src changes.
  const [brokenSrc, setBrokenSrc] = useState<string | null>(null);

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

  /**
   * Every local file preview is a blob: URL that holds the file in memory
   * until revoked. Track the live one and revoke it as soon as it is replaced
   * (by the uploaded URL, another file, or Remove) and on unmount.
   */
  const blobUrlRef = useRef<string | null>(null);
  const showPreview = useCallback((next: string | null) => {
    if (blobUrlRef.current && blobUrlRef.current !== next) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    if (next?.startsWith("blob:")) blobUrlRef.current = next;
    setLocalPreview(next);
  }, []);

  useEffect(
    () => () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    },
    []
  );

  useEffect(() => {
    showPreview(currentImageUrl || null);
  }, [currentImageUrl, showPreview]);

  useEffect(() => {
    if (imageUrl && publicId) {
      showPreview(imageUrl);
      onUploadComplete(imageUrl, publicId, { width, height });
    }
  }, [imageUrl, publicId, width, height, onUploadComplete, showPreview]);

  const dropZoneClass = useMemo(() => {
    const base =
      "rounded-xl border border-dashed p-4 transition-colors motion-reduce:transition-none";
    const accent = isDragOver
      ? "border-[rgba(76,174,137,0.55)] bg-[rgba(76,174,137,0.10)]"
      : "border-[rgba(241,243,241,0.18)] bg-[rgba(7,10,9,0.55)] hover:border-[rgba(76,174,137,0.40)]";
    return `${base} ${accent}`;
  }, [isDragOver]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const startUpload = async (file: File) => {
    setFileName(file.name);
    showPreview(URL.createObjectURL(file));
    await handleFileSelect(file);
  };

  const onFileInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (!selected) {
      return;
    }
    await startUpload(selected);
  };

  const onDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);

    const dropped = event.dataTransfer.files?.[0];
    if (!dropped) {
      return;
    }
    await startUpload(dropped);
  };

  const removeImage = () => {
    resetImage();
    showPreview(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onRemove?.();
  };

  const progress = (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex items-center gap-2 text-xs text-[var(--tv-text)]">
        <Loader2 className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
        Uploading… {uploadProgress}%
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(241,243,241,0.12)]">
        <div
          className="h-full rounded-full bg-[var(--tv-brass)] transition-[width] motion-reduce:transition-none"
          style={{ width: `${uploadProgress}%` }}
        />
      </div>
    </div>
  );

  const isBroken = localPreview !== null && brokenSrc === localPreview;
  const status = isUploading
    ? "Uploading"
    : imageUrl
      ? "Uploaded"
      : "Current image";

  return (
    // @container: the thumbnail/actions layout follows the uploader's own
    // width, not the viewport, so it stays stacked in a half-width column
    // (ProductForm on md+) and goes side by side only where there is room.
    <div className="@container space-y-3">
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
          <div className="flex flex-col gap-4 @lg:flex-row @lg:items-start">
            {/* Thumbnail: capped, left-aligned, whole image visible. */}
            <div
              className={`relative w-full min-w-0 overflow-hidden rounded-lg border border-[var(--tv-rule)] bg-[var(--tv-graphite)] @lg:flex-1 ${maxWidthClassMap[aspectRatio]} ${aspectRatioClassMap[aspectRatio]}`}
            >
              {isBroken ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-xs text-[var(--tv-text-muted)]">
                  <ImageOff className="h-6 w-6" aria-hidden="true" />
                  <span>Preview unavailable — replace the image</span>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element -- blob: previews and arbitrary admin URLs; next/image cannot load either
                <img
                  src={localPreview}
                  alt={alt ?? ""}
                  className="h-full w-full object-contain"
                  onError={() => setBrokenSrc(localPreview)}
                />
              )}

              {isUploading ? (
                <div className="absolute inset-x-0 bottom-0 bg-[rgba(7,10,9,0.78)] p-3">{progress}</div>
              ) : null}
            </div>

            {/* Status + actions. */}
            <div className="flex min-w-0 flex-col gap-3 @lg:w-48 @lg:shrink-0">
              <div className="min-w-0">
                <p className="tv-adm-meta text-xs">{status}</p>
                {fileName ? (
                  <p className="truncate text-sm text-[var(--tv-text)]" title={fileName}>
                    {fileName}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={isUploading}
                  className="tv-adm-action inline-flex min-h-[44px] items-center gap-2"
                >
                  <ImagePlus className="h-3.5 w-3.5" aria-hidden="true" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  disabled={isUploading}
                  className="tv-adm-action tv-adm-action--danger inline-flex min-h-[44px] items-center gap-2"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Remove
                </button>
              </div>

              <p className="tv-adm-meta text-xs">{HINT}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={openFilePicker}
              disabled={isUploading}
              className="flex min-h-[44px] w-full flex-col items-center justify-center gap-2 py-6 text-center text-sm text-[var(--tv-text)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <UploadCloud className="h-6 w-6 text-[var(--tv-patina)]" aria-hidden="true" />
              <span>Drag and drop an image here, or click to select</span>
              <span className="text-xs text-[var(--tv-text-muted)]">{HINT}</span>
            </button>
            {isUploading ? progress : null}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={onFileInputChange}
          className="hidden"
        />
      </div>

      {error ? <p className="text-sm text-[var(--tv-danger)]">{error}</p> : null}
    </div>
  );
}
