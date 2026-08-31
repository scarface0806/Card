'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import NFCCard, {
  NFC_CARD_DEMO,
  NFC_CARD_FINISHES,
  type NFCCardVariant,
} from '@/components/ui/NFCCard';

/**
 * The picker shows the colour instead of naming it, and swapping a finish
 * cross-fades the card surface. Nothing here rotates: the card that used to be
 * dragged through 360 degrees is now a static face (see NFCCard).
 *
 * Swatch chips read their gradient straight out of NFC_CARD_FINISHES, so the
 * chip and the card it selects can no longer drift apart — they are the same
 * value.
 */
const finishes: { variant: NFCCardVariant; name: string }[] = [
  { variant: 'obsidian', name: 'Obsidian Dark' },
  { variant: 'ocean', name: 'Ocean Depth' },
  { variant: 'emerald', name: 'Emerald Luxe' },
  { variant: 'roseGold', name: 'Rose Gold' },
];

export default function InteractiveCardShowcaseSection() {
  const [selected, setSelected] = useState(0);
  const active = finishes[selected];

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
          <p className="tv-lead mx-auto">Tap a colour to swap the finish.</p>
        </motion.div>

        {/* The object, lit against paper. The glow tint follows the active
            finish and cross-fades with it. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="flex items-center justify-center mb-12 md:mb-14"
        >
          <NFCCard
            variant={active.variant}
            label={active.name}
            size="showcase"
            glow
            {...NFC_CARD_DEMO}
          />
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
            {finishes.map((finish, idx) => (
              <button
                key={finish.variant}
                type="button"
                onClick={() => setSelected(idx)}
                aria-pressed={selected === idx}
                className="tv-swatch tv-focus"
              >
                <span
                  className="tv-swatch-chip"
                  style={{ background: NFC_CARD_FINISHES[finish.variant] }}
                  aria-hidden="true"
                />
                <span className="tv-swatch-label">{finish.name}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
