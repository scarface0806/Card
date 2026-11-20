'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import NFCCard from '@/components/ui/NFCCard';
import CardFlipImage from '@/components/ui/CardFlipImage';
import {
  cardAspectClass,
  normalizeOrientation,
  type CardOrientation,
} from '@/lib/products/orientation';
import CardArtwork from '@/components/ui/CardArtwork';
import { useCardBackImage } from '@/hooks/useCardBackImage';

interface CardPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  card: {
    id: string | number;
    name: string;
    type: 'basic' | 'premium' | 'custom';
    price: string;
    color: string;
    images?: string[];
    image?: string;
    /** A real back-image field, if one is ever added. Optional by design. */
    backImage?: string;
    /**
     * Card shape. Optional so any caller that predates the field still
     * compiles; absent is normalised to horizontal, which is what those
     * products are.
     */
    orientation?: CardOrientation;
  } | null;
}

export default function CardPreviewModal({ isOpen, onClose, card }: CardPreviewModalProps) {
  const frontSrc = card?.images?.[0] || card?.image;
  // Same probe CardFlipImage runs (and the browser caches the image), read
  // here only to know whether the View back pill will exist, so room is
  // reserved under the card for it - and not left empty when it will not.
  const { available: hasBack } = useCardBackImage(frontSrc, card?.backImage);

  if (!card) return null;

  const vertical = normalizeOrientation(card.orientation) === 'vertical';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="tv-modal-backdrop z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="card-preview-title"
              className={`tv-modal-panel pointer-events-auto ${vertical ? 'max-w-2xl' : 'max-w-lg'}`}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="tv-modal-close z-10"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* The whole modal fits the screen: the body's own cap
                  (min(64vh, 34rem)) was shorter than a vertical card, so it
                  scrolled and hid the name and price. Raised to the viewport;
                  the scroll stays only as a last resort on very short screens.
                  `!` because .tv-modal-body is unlayered CSS. */}
              <div className="tv-modal-body !max-h-[calc(100dvh-2rem)]">
                {/* Vertical cards: card left, details right on sm+, so the
                    panel is wider than tall. Horizontal keeps the stacked look. */}
                <div
                  className={
                    vertical
                      ? 'flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8'
                      : 'flex flex-col items-center gap-7'
                  }
                >
                  {/* Card Preview. Flat and square to the page; it settles in.

                      Sized by orientation. Vertical: the HEIGHT is bounded by
                      the viewport and the width follows the 5:8 shape, so a
                      tall card never pushes the details off screen.

                      No overflow-hidden on this box or on CardFlipImage's: the
                      View back pill is drawn BELOW the card (mb reserves its
                      room), and overflow-hidden here would clip it. The
                      rounding and clipping live on each face instead. */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className={`relative shrink-0 ${
                      vertical
                        ? 'aspect-[5/8] w-auto h-[min(46vh,520px)] sm:h-[min(62vh,520px)]'
                        : `${cardAspectClass('horizontal')} w-full max-w-sm`
                    } ${hasBack ? 'mb-14' : ''}`}
                  >
                    {/* The photograph, or the finish drawn from the design's
                        own gradient. This is the fullest view of the card a
                        customer gets, so it is also where turning it over
                        matters most. */}
                    <CardFlipImage
                      frontSrc={frontSrc}
                      backImage={card.backImage}
                      name={card.name}
                      /* NOT "absolute inset-0". CardFlipImage puts `relative`
                         on its own box, and Tailwind emits .relative after
                         .absolute, so the caller's `absolute` lost and the box
                         collapsed to zero height. Filling the parent, which
                         carries the size, is all this needs to do. */
                      className="h-full w-full rounded-2xl"
                      style={{ background: card.color, boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }}
                      backFaceClassName="absolute inset-0 overflow-hidden rounded-2xl"
                      imageClassName="h-full w-full object-contain"
                      // Under the card, centred - not on the artwork, where the
                      // old top-left spot covered its heading.
                      controlClassName="-bottom-12 left-1/2 -translate-x-1/2 min-h-[44px] px-3.5"
                      front={
                        <div className="absolute inset-0 overflow-hidden rounded-2xl">
                          {frontSrc ? (
                            // The whole artwork, never cropped. No extra NFC
                            // badge: the uploaded artwork carries its own mark,
                            // and the modal's used to sit on top of it.
                            <CardArtwork
                              src={frontSrc}
                              alt={`${card.name} NFC card`}
                              name={card.name}
                              width={480}
                              height={300}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            // Drawn finish: NFCCard brings its own NFC mark.
                            <NFCCard name={card.name} color={card.color} />
                          )}
                        </div>
                      }
                    />

                    {/* Shine sweep, clipped to the card's rounded box. Pointer-
                        transparent so the click-to-flip underneath still works;
                        hidden under reduced motion. */}
                    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl motion-reduce:hidden">
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ duration: 1.5, delay: 0.4, ease: 'easeInOut' }}
                        className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
                      />
                    </div>
                  </motion.div>

                  {/* Card Details */}
                  <div className={vertical ? 'min-w-0 text-center sm:pr-8 sm:text-left' : 'text-center'}>
                    <p className="tv-mono mb-2">
                      {card.type === 'custom' ? 'Custom' : card.type === 'premium' ? 'Premium' : 'Basic'}
                    </p>

                    <h2 id="card-preview-title" className="tv-h3 mb-3">
                      {card.name}
                    </h2>

                    {card.type !== 'custom' && (
                      <p
                        className="text-2xl font-semibold text-[#F1F3F1] mb-3"
                        style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
                      >
                        {card.price}
                      </p>
                    )}

                    <p className="tv-small">
                      <a
                        href="/preview-website"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tv-btn-tertiary !min-h-0 !text-sm relative z-10 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Free Lifetime Website
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
