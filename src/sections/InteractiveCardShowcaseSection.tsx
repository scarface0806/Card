'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Card360Viewer from '@/components/Card360Viewer';

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
          <p className="body-lg section-subtitle">
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
              className={`px-6 md:px-7 py-2.5 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-220 whitespace-nowrap ${
                selectedCard === idx
                  ? 'bg-linear-to-r from-teal-600 to-emerald-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
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

