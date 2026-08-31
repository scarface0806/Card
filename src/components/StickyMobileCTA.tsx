'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, X } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

/**
 * Sticky Mobile CTA
 * Shows after scrolling past the hero section
 * Only visible on mobile/tablet devices
 */
export default function StickyMobileCTA() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling 600px (past hero)
      const shouldShow = window.scrollY > 600;
      setIsVisible(shouldShow && !isDismissed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        >
          <div className="bg-[#151C1A]/97 backdrop-blur-md border-t border-[#F1F3F1]/12 px-4 py-3">
            <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
              {/* Value prop */}
              <div className="flex-1 min-w-0">
                <p className="tv-h4 truncate">Ready when you are</p>
                <p className="tv-small truncate">No renewal fees</p>
              </div>

              {/* Tier 1 gilded, same label as every other primary action. */}
              <Link href={ROUTES.CREATE_CARD} className="tv-btn tv-btn-gilded shrink-0">
                Get your card
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="tv-focus shrink-0 p-2 text-[#A9B5B0] hover:text-[#F1F3F1] transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

