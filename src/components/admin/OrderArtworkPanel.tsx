'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, Maximize2, X } from 'lucide-react';
import { cloudinaryDownload, cloudinaryThumbnail } from '@/lib/cloudinary-url';

/**
 * "Uploaded artwork" in the admin order drawer, for Customised Card orders:
 * the customer's front and back images as thumbnails, each with a full-size
 * view and a download of the ORIGINAL file (Cloudinary fl_attachment), named
 * after the order so a print folder stays sorted.
 *
 * Renders nothing for an order with no artwork.
 */
export default function OrderArtworkPanel({
  orderNumber,
  frontUrl,
  backUrl,
  designFee,
}: {
  orderNumber: string;
  frontUrl?: string | null;
  backUrl?: string | null;
  designFee?: number | null;
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

  const sides = [
    { key: 'front', label: 'Front', url: frontUrl },
    { key: 'back', label: 'Back', url: backUrl },
  ].filter((side): side is { key: string; label: string; url: string } => Boolean(side.url));

  if (sides.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="tv-adm-label">Uploaded artwork</h3>
      <div className="bg-[var(--tv-slate)] rounded-lg p-4 space-y-3">
        <p className="text-sm text-[var(--tv-text-muted)]">
          Customer&apos;s own design
          {typeof designFee === 'number' ? ` · design charge ₹${designFee.toLocaleString()}` : ''}.
          {sides.length < 2 && ' One side is missing - contact the customer before printing.'}
        </p>

        <div className="grid grid-cols-2 gap-4">
          {sides.map((side) => (
            <figure key={side.key} className="space-y-2">
              <button
                type="button"
                onClick={(event) => {
                  returnFocusRef.current = event.currentTarget;
                  setOpen({ label: side.label, url: side.url });
                }}
                className="group relative block w-full overflow-hidden rounded-md border border-[var(--tv-rule)] bg-black/20"
                aria-label={`View ${side.label.toLowerCase()} artwork full size`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnail; next/image adds nothing in an admin drawer. */}
                <img
                  src={cloudinaryThumbnail(side.url)}
                  alt={`${side.label} artwork for order ${orderNumber}`}
                  className="w-full h-auto"
                  loading="lazy"
                />
                <span className="absolute right-2 top-2 rounded bg-black/60 p-1 text-white" aria-hidden="true">
                  <Maximize2 className="w-3.5 h-3.5" />
                </span>
              </button>
              <figcaption className="flex items-center justify-between gap-2 text-sm text-[var(--tv-text)]">
                <span>{side.label}</span>
                <a
                  href={cloudinaryDownload(side.url, `${orderNumber}-${side.key}`)}
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
          aria-label={`${open.label} artwork, full size`}
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
          {/* eslint-disable-next-line @next/next/no-img-element -- original artwork at full resolution. */}
          <img
            src={open.url}
            alt={`${open.label} artwork for order ${orderNumber}, full size`}
            className="max-h-full max-w-full object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
