'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Maximize2, X } from 'lucide-react';
import { cloudinaryDownload, cloudinaryThumbnail } from '@/lib/cloudinary-url';

/**
 * "Uploaded images" in the admin order drawer: the customer's profile photo
 * (any product) and, for Customised Card orders, their front and back artwork.
 * Each has a thumbnail, a full-size view and a download of the ORIGINAL file
 * (Cloudinary fl_attachment), named after the order so a print folder stays
 * sorted.
 *
 * Renders nothing for an order with no uploads - which is every order placed
 * before the profile photo was actually uploaded (it used to arrive as {}).
 */
export default function OrderArtworkPanel({
  orderNumber,
  frontUrl,
  backUrl,
  designFee,
  profilePhotoUrl,
}: {
  orderNumber: string;
  frontUrl?: string | null;
  backUrl?: string | null;
  designFee?: number | null;
  profilePhotoUrl?: string | null;
}) {
  const [open, setOpen] = useState<{ label: string; url: string } | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      returnFocusRef.current?.focus();
    };
  }, [open]);

  const isCustomDesign = Boolean(frontUrl || backUrl || designFee);
  const cardSides = [frontUrl, backUrl].filter(Boolean).length;

  const images = [
    { key: 'front', label: 'Card front', url: frontUrl },
    { key: 'back', label: 'Card back', url: backUrl },
    { key: 'profile-photo', label: 'Profile photo', url: profilePhotoUrl },
  ].filter((image): image is { key: string; label: string; url: string } => Boolean(image.url));

  if (images.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="tv-adm-label">Uploaded images</h3>
      <div className="bg-[var(--tv-slate)] rounded-lg p-4 space-y-3">
        {isCustomDesign && (
          <p className="text-sm text-[var(--tv-text-muted)]">
            Customer&apos;s own card design
            {typeof designFee === 'number' ? ` · design charge ₹${designFee.toLocaleString()}` : ''}.
            {cardSides < 2 && ' One side is missing - contact the customer before printing.'}
          </p>
        )}

        <div className="grid grid-cols-2 gap-4">
          {images.map((image) => (
            <figure key={image.key} className="space-y-2">
              <button
                type="button"
                onClick={(event) => {
                  returnFocusRef.current = event.currentTarget;
                  setOpen({ label: image.label, url: image.url });
                }}
                className="group relative block w-full overflow-hidden rounded-md border border-[var(--tv-rule)] bg-black/20"
                aria-label={`View ${image.label.toLowerCase()} full size`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail; next/image adds nothing in an admin drawer. */}
                <img
                  src={cloudinaryThumbnail(image.url)}
                  alt={`${image.label} for order ${orderNumber}`}
                  className="w-full h-auto"
                  loading="lazy"
                />
                <span className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white" aria-hidden="true">
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
              </button>
              <figcaption className="flex items-center justify-between gap-2 text-sm text-[var(--tv-text)]">
                <span>{image.label}</span>
                <a
                  href={cloudinaryDownload(image.url, `${orderNumber}-${image.key}`)}
                  className="inline-flex min-h-[44px] items-center gap-1.5 text-[var(--tv-brass)] hover:underline"
                  download
                >
                  <Download className="w-4 h-4" aria-hidden="true" />
                  Download
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${open.label}, full size`}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(null)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(null)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close full-size view"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element -- original image at full resolution. */}
          <img
            src={open.url}
            alt={`${open.label} for order ${orderNumber}, full size`}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
