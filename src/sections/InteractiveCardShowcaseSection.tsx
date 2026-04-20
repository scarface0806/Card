'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const Card360Viewer = dynamic(() => import('@/components/Card360Viewer'), {
  ssr: false,
  loading: () => <div className="w-full aspect-square" />,
});

const cardVariants = [
  { id: 1, name: 'Obsidian Dark' },
  { id: 2, name: 'Ocean Depth' },
  { id: 3, name: 'Emerald Luxe' },
  { id: 4, name: 'Rose Gold' },
];

export default function InteractiveCardShowcaseSection() {
  const [selectedCard, setSelectedCard] = useState(0);

  return (
    <section className="relative w-full section-spacing overflow-hidden bg-white">
      <div className="site-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="section-header"
        >
          <h2 className="heading-1 section-title font-space-grotesk">
            Your Card.{' '}
            <span className="text-gradient">
              In Motion.
            </span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 section-subtitle">
            See your NFC card come to life. Interact, rotate, and transform.
          </p>
        </motion.div>

        {/* Card Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="flex items-center justify-center mb-8"
        >
          <Card360Viewer selectedCardIndex={selectedCard} />
        </motion.div>

        {/* Card Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-3 md:gap-4"
        >
          {cardVariants.map((variant, idx) => (
            <motion.button
              key={variant.id}
              onClick={() => setSelectedCard(idx)}
              whileHover={{ y: -2 }}
              whileTap={{ y: 1 }}
              transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              className={`px-6 md:px-7 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base whitespace-nowrap border transition-all duration-300 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                selectedCard === idx
                  ? 'text-white border-transparent bg-gradient-to-r from-[#0A1631] via-[#122B54] to-[#1A3D76] shadow-[0_10px_24px_rgba(10,22,49,0.28),inset_0_1px_0_rgba(255,255,255,0.16)] hover:from-[#0D1D3E] hover:via-[#163462] hover:to-[#214B8A]'
                  : 'bg-white text-slate-600 border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.06)] hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 hover:shadow-[0_6px_16px_rgba(15,23,42,0.08)]'
              }`}
            >
              {variant.name}
            </motion.button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

