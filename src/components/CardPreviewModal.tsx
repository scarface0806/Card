'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Wifi } from 'lucide-react';
import NFCCard from '@/components/ui/NFCCard';
import CardFlipImage from '@/components/ui/CardFlipImage';
import CardArtwork from '@/components/ui/CardArtwork';

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
  } | null;
}

export default function CardPreviewModal({ isOpen, onClose, card }: CardPreviewModalProps) {
  if (!card) return null;

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
              className="tv-modal-panel max-w-lg pointer-events-auto"
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

              <div className="tv-modal-body">
                {/* Card Preview */}
                {/* Flat and square to the page. The card used to swing in on
                    rotateY/rotateX behind a perspective; there is no rotation
                    anywhere in the product any more, so it simply settles. */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="relative aspect-[1.6/1] rounded-2xl overflow-hidden mx-auto max-w-sm mb-7"
                  style={{
                    background: card.color,
                    boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* The photograph, or the finish drawn from the design's own
                      gradient. NFCCard brings its own NFC mark and name
                      plate, so the overlay below is only for the photo case.

                      This is the fullest view of the card a customer gets, so
                      it is also where turning it over matters most. */}
                  <CardFlipImage
                    frontSrc={card.images?.[0] || card.image}
                    backImage={card.backImage}
                    name={card.name}
                    className="absolute inset-0"
                    front={
                      card.images?.[0] || card.image ? (
                        <>
                          {/* CardArtwork, not a bare <img>: a URL that 404s
                              used to leave an empty box with the gradient
                              showing through and no explanation. */}
                          <CardArtwork
                            src={card.images?.[0] || card.image}
                            alt={`${card.name} NFC card`}
                            name={card.name}
                            width={480}
                            height={300}
                          />

                          <div className="absolute right-4 top-4">
                            <div className="w-9 h-9 rounded-full bg-[#070A09]/45 flex items-center justify-center">
                              <Wifi className="w-4 h-4 text-white rotate-45" aria-hidden="true" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <NFCCard name={card.name} color={card.color} />
                      )
                    }
                  />

                  {/* Shine sweep. Pointer-transparent so it cannot intercept a
                      click meant for the card underneath it. */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, delay: 0.4, ease: 'easeInOut' }}
                    className="pointer-events-none absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 motion-reduce:hidden"
                  />
                </motion.div>

                {/* Card Details */}
                <div className="text-center">
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
