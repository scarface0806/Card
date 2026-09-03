'use client';

import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi } from 'lucide-react';
import type { SelectedProduct } from '@/lib/products/selection';
import CardFlipImage from '@/components/ui/CardFlipImage';

interface CardLivePreviewProps {
  fullName: string;
  designation: string;
  company: string;
  /** The product being bought, from its database row. */
  product: SelectedProduct;
}

/**
 * The "YOUR CARD" preview on the checkout page.
 *
 * It shows the artwork the admin actually uploaded for this product
 * (Product.images[0], a Cloudinary secure_url), with the customer's name and
 * designation overlaid live as they type.
 *
 * The panel used to draw a generic grey gradient for every order, because the
 * product was resolved from a hardcoded tier list that had a `color` but no
 * image. It now takes the product row, so the artwork, the name and the tier
 * badge are all the real ones.
 *
 * `pt-[63%]` holds the card at 1.587:1 - an ISO/IEC 7810 ID-1 card is
 * 85.6 x 54 mm, or 1.5852:1 - so the artwork is not distorted.
 */
export default function CardLivePreview({
  fullName,
  designation,
  company,
  product,
}: CardLivePreviewProps) {
  // The live-typed name, designation and company belong to the FRONT of the
  // card, so they travel with it when it turns over rather than sitting on top
  // of the back artwork.
  const front = (
    <>
      {product.imageUrl && (
        // next/image so the Cloudinary original is resized and served as
        // AVIF/WebP rather than shipping a multi-megabyte JPEG into a 320px
        // panel. res.cloudinary.com is already allowed in next.config.ts.
        <Image
          src={product.imageUrl}
          alt={`${product.name} NFC card`}
          fill
          sizes="(max-width: 1024px) 100vw, 320px"
          className="object-cover"
          // Above the fold on the checkout page, and it is the thing the
          // customer is buying, so it should not wait for lazy loading.
          priority
        />
      )}

      {/* NFC mark */}
      <div className="absolute top-4 right-4">
        <Wifi className="w-6 h-6 text-white/60 rotate-45" aria-hidden="true" />
      </div>

      {/* Sheen across the laminate */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />

      {/* Live content. Sits above the artwork, on a scrim strong enough to keep
          the text legible over a light or busy image. */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
        <AnimatePresence mode="wait">
          <motion.p
            key={fullName || 'name-placeholder'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="text-white font-semibold text-base md:text-lg leading-tight break-words line-clamp-2 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]"
          >
            {fullName || 'Your Name'}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.p
            key={designation || 'designation-placeholder'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15, delay: 0.02 }}
            className="text-white/85 text-xs md:text-sm leading-tight break-words line-clamp-1 mt-0.5 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]"
          >
            {designation || 'Your Designation'}
          </motion.p>
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {company && (
            <motion.p
              key={company}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15, delay: 0.04 }}
              className="text-white/70 text-xs leading-tight break-words line-clamp-1 mt-0.5 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]"
            >
              {company}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  return (
    <CardFlipImage
      frontSrc={product.imageUrl}
      backImage={product.backImageUrl}
      name={product.name}
      front={front}
      // A hairline in the system's rule colour, not border-gray-200, so the
      // card edge reads as part of the dark shell instead of a light-mode
      // leftover sitting on it. `pt-[63%]` still holds the ISO/IEC 7810 ratio,
      // and both faces are pinned to that same box, so turning the card cannot
      // move the rail beneath it.
      className="overflow-hidden rounded-xl pt-[63%] border border-[rgba(241,243,241,0.14)] shadow-[0_18px_44px_rgba(0,0,0,0.45)]"
      // The product's own finish, drawn behind the artwork. It shows through
      // while the image loads, and it IS the card when the product has no
      // image at all - the only case in which the placeholder is used.
      style={{ background: product.color }}
    />
  );
}
