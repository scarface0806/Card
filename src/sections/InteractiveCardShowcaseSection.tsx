'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const Card360Viewer = dynamic(() => import('@/components/Card360Viewer'), {
  ssr: false,
  loading: () => <div className="w-full aspect-square" />,
});

/**
 * The picker now shows the colour instead of naming it.
 *
 * `chip` mirrors the `face` gradient of the matching entry in Card360Viewer's
 * `cardDesigns`, which this list selects into by index — so these four must
 * stay in the same order as the first four there.
 */
const cardVariants = [
  {
    id: 1,
    name: 'Obsidian Dark',
    chip: 'linear-gradient(145deg, #2C3134 0%, #171B1D 45%, #0A0C0D 100%)',
  },
  {
    id: 2,
    name: 'Ocean Depth',
    chip: 'linear-gradient(145deg, #1E5567 0%, #123B4B 45%, #071E29 100%)',
  },
  {
    id: 3,
    name: 'Emerald Luxe',
    chip: 'linear-gradient(145deg, #328565 0%, #1B5A44 45%, #0B3125 100%)',
  },
  {
    id: 4,
    name: 'Rose Gold',
    chip: 'linear-gradient(145deg, #E8B49C 0%, #BE7C61 32%, #8A5240 68%, #5A2F24 100%)',
  },
];

export default function InteractiveCardShowcaseSection() {
  const [selectedCard, setSelectedCard] = useState(0);

  return (
    <section className="tv-surface-bone tv-section relative w-full overflow-hidden">
      <div className="site-container relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="max-w-2xl mx-auto text-center mb-12 md:mb-14"
        >
          <p className="tv-eyebrow tv-eyebrow--center mb-6">Finishes</p>
          <h2 className="tv-h2 mb-4">Pick a finish. Watch it change.</h2>
          <p className="tv-lead mx-auto">
            Drag the card to turn it. Tap a colour to swap the finish.
          </p>
        </motion.div>

        {/* The object, lit against paper. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="flex items-center justify-center mb-12 md:mb-14"
        >
          <Card360Viewer selectedCardIndex={selectedCard} />
        </motion.div>

        {/* Colourway picker. Each control renders the actual finish rather
            than the name of it — Rose Gold now looks like rose gold. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
        >
          <h3 className="sr-only">Choose a card finish</h3>
          <div className="flex flex-wrap items-start justify-center gap-5 sm:gap-8">
            {cardVariants.map((variant, idx) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedCard(idx)}
                aria-pressed={selectedCard === idx}
                className="tv-swatch tv-focus"
              >
                <span
                  className="tv-swatch-chip"
                  style={{ background: variant.chip }}
                  aria-hidden="true"
                />
                <span className="tv-swatch-label">{variant.name}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
