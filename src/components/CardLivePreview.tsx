'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi } from 'lucide-react';
import type { SelectedProduct } from '@/lib/products/selected-product';

interface CardLivePreviewProps {
  fullName: string;
  designation: string;
  company: string;
  /** The product being bought, from its database row. */
  product: SelectedProduct;
}

export default function CardLivePreview({
  fullName,
  designation,
  company,
  product,
}: CardLivePreviewProps) {
  return (
    <div
      // A hairline in the system's rule colour, not border-gray-200, so the
      // card edge reads as part of the dark shell instead of a light-mode
      // leftover sitting on it.
      className="relative overflow-hidden rounded-xl pt-[63%] border border-[rgba(241,243,241,0.14)] shadow-[0_18px_44px_rgba(0,0,0,0.45)]"
      // The product's own gradient, drawn behind the photograph so a slow or
      // broken image still leaves the card looking like a card.
      style={{ background: product.color }}
    >
      {/* The product photograph the admin uploaded, when there is one. */}
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={`${product.name} NFC card`}
          width={480}
          height={300}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* NFC mark */}
      <div className="absolute top-4 right-4">
        <Wifi className="w-6 h-6 text-white/60 rotate-45" aria-hidden="true" />
      </div>

      {/* Sheen across the laminate */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />

      {/* Live content */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/75 via-black/45 to-transparent">
        <AnimatePresence mode="wait">
          <motion.p
            key={fullName || 'name-placeholder'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="text-white font-semibold text-base md:text-lg leading-tight break-words line-clamp-2"
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
            className="text-white/80 text-xs md:text-sm leading-tight break-words line-clamp-1 mt-0.5"
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
              className="text-white/65 text-xs leading-tight break-words line-clamp-1 mt-0.5"
            >
              {company}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
