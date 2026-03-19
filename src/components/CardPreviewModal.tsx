'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Wifi } from 'lucide-react';

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
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative bg-white rounded-3xl shadow-lg max-w-lg w-full p-8 pointer-events-auto">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Card Preview */}
              <div className="mb-6">
                <motion.div
                  initial={{ rotateY: -15, rotateX: 5 }}
                  animate={{ rotateY: 0, rotateX: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="relative aspect-[1.6/1] rounded-2xl overflow-hidden shadow-xl mx-auto max-w-sm"
                  style={{
                    background: card.color,
                    transformStyle: 'preserve-3d',
                    perspective: '1000px',
                  }}
                >
                  <img
                    src={card.images?.[0] || card.image || "/placeholder.png"}
                    alt={card.name}
                    className="h-full w-full object-cover"
                  />

                  <div className="absolute right-4 top-4">
                    <div className="w-10 h-10 rounded-full bg-black/30 flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-white rotate-45" />
                    </div>
                  </div>

                  {/* Shine effect */}
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, delay: 0.5, ease: 'easeInOut' }}
                    className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  />
                </motion.div>
              </div>

              {/* Card Details */}
              <div className="text-center">
                <h3 className="text-2xl font-bold text-[#0f2e25] font-space-grotesk mb-2">
                  {card.name}
                </h3>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      card.type === 'premium'
                        ? 'bg-amber-100 text-amber-700'
                        : card.type === 'custom'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-teal-100 text-teal-700'
                    }`}
                  >
                    {card.type === 'custom' ? 'Custom' : card.type === 'premium' ? 'Premium' : 'Basic'}
                  </span>
                </div>
                {card.type !== 'custom' && (
                  <p className="text-2xl font-bold text-teal-700 mb-2">{card.price}</p>
                )}
                <p className="text-sm text-[#4b635d]">
                  <a href="/preview-website" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 relative z-10 cursor-pointer" onClick={(e) => e.stopPropagation()}>Free Lifetime Website</a>
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

