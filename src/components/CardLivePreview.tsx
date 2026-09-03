'use client';

import { useState } from 'react';
import { Expand, Wifi } from 'lucide-react';

import type { SelectedProduct } from '@/lib/products/selection';
import CardArtwork from '@/components/ui/CardArtwork';
import CardQuickViewModal from '@/components/CardQuickViewModal';

interface CardLivePreviewProps {
  /** The product being bought, from its database row. */
  product: SelectedProduct;
}

/**
 * The "YOUR CARD" panel on the checkout page.
 *
 * It shows the artwork the admin uploaded for this product
 * (Product.images[0], a Cloudinary secure_url) and nothing else.
 *
 * THE TYPED DETAILS ARE DELIBERATELY NOT ON THE CARD.
 * This panel used to overlay the live-typed name, designation and company on a
 * dark scrim across the bottom of the artwork. That was removed: it obscured
 * the design the customer is choosing, and it implied a layout the printed
 * card does not necessarily use. The form still holds and submits every one of
 * those fields - only the overlay is gone.
 *
 * Inspecting the card properly now happens in the Quick-view lightbox, which
 * shows it large and can turn it over.
 *
 * `pt-[63%]` holds the card at 1.587:1 - an ISO/IEC 7810 ID-1 card is
 * 85.6 x 54 mm, or 1.5852:1 - so the artwork is not distorted.
 */
export default function CardLivePreview({ product }: CardLivePreviewProps) {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  return (
    <>
      <div
        // A hairline in the system's rule colour, not border-gray-200, so the
        // card edge reads as part of the dark shell instead of a light-mode
        // leftover sitting on it.
        className="relative overflow-hidden rounded-xl pt-[63%] border border-[rgba(241,243,241,0.14)] shadow-[0_18px_44px_rgba(0,0,0,0.45)]"
        // The product's own finish, drawn behind the artwork. It shows through
        // while the image loads, and it IS the card when the product has no
        // image at all.
        style={{ background: product.color }}
      >
        <CardArtwork
          src={product.imageUrl}
          alt={`${product.name} NFC card`}
          name={product.name}
          label={product.tierLabel}
          className="object-cover"
          optimized
          sizes="(max-width: 1024px) 100vw, 320px"
          // Above the fold on the checkout page, and it is the thing the
          // customer is buying, so it should not wait for lazy loading.
          priority
        />

        {/* NFC mark */}
        <div className="absolute top-4 right-4">
          <Wifi className="w-6 h-6 text-white/60 rotate-45" aria-hidden="true" />
        </div>

        {/* Sheen across the laminate */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />

        {/* Quick view. Set like the mono labels on the card face so it reads as
            part of the card rather than as chrome dropped on top of it. */}
        <button
          type="button"
          onClick={() => setIsQuickViewOpen(true)}
          aria-label={`Open a larger view of the ${product.name} card`}
          className="tv-focus absolute bottom-3 left-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-[#F1F3F1]/40 bg-[#070A09]/72 px-2.5 py-1.5 text-[#F1F3F1] backdrop-blur-[2px] transition-colors duration-200 hover:bg-[#070A09]/88 hover:border-[#F1F3F1]/60"
          style={{
            fontFamily: 'var(--font-mono), ui-monospace, monospace',
            fontSize: '0.625rem',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <Expand className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
          <span aria-hidden="true">Quick view</span>
        </button>
      </div>

      <CardQuickViewModal
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
        name={product.name}
        frontSrc={product.imageUrl}
        backImage={product.backImageUrl}
        color={product.color}
        eyebrow={product.tierLabel}
        price={product.priceFormatted}
      />
    </>
  );
}
