'use client';

import MotionLink from '@/components/MotionLink';
import { motion } from 'framer-motion';
import { ArrowUpRight, Star } from 'lucide-react';
import { ROUTES } from '@/utils/constants';
import NFCCard, { NFC_CARD_DEMO } from '@/components/ui/NFCCard';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.23, 1, 0.320, 1] as const },
  },
};

// Spec rows sit under the card so the right column carries weight instead of
// leaving a single small object floating in empty space.
// Every value here restates a claim that already exists elsewhere in the
// codebase (FAQ answers / the "No Renewal Fees" chip). Nothing new is asserted.
// "Hosted forever" replaced "Edit anytime": the profile is not self-editable,
// updates are a paid WhatsApp request handled by the team.
const cardSpecs = [
  { label: 'Works with', value: 'iPhone & Android' },
  { label: 'Profile', value: 'Hosted forever' },
  { label: 'Renewal fees', value: 'None' },
];

export default function HeroSection() {
  return (
    <section className="tv-hero relative w-full min-h-screen flex items-center overflow-visible">
      <div className="site-container py-24 lg:py-28 overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* LEFT - Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 lg:pr-4"
          >
            <motion.p variants={itemVariants} className="tv-eyebrow mb-7">
              NFC Business Cards
            </motion.p>

            {/* Measure is capped at 15ch so this always breaks into two clean
                lines instead of four with a single word stranded. */}
            <motion.h1 variants={itemVariants} className="tv-display tv-measure-display mb-6">
              One tap. Your entire profile.
            </motion.h1>

            <motion.p variants={itemVariants} className="tv-lead tv-measure-lead mb-8">
              Turn every handshake into a connection. Your NFC card opens your full
              profile in seconds — no apps, no typing, nothing to install.
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 mb-10">
              <MotionLink
                href={ROUTES.CREATE_CARD}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className="tv-btn tv-btn-lg tv-btn-gilded tv-btn-block"
              >
                Get your card
                <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
              </MotionLink>

              {/* Secondary tier carries no arrow - the glyph is reserved for
                  the primary action so it means something again. */}
              <MotionLink
                href={ROUTES.HOW_TO_USE}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className="tv-btn tv-btn-lg tv-btn-secondary tv-btn-block"
              >
                See how it works
              </MotionLink>
            </motion.div>

            {/* Social proof. Figures are unchanged. */}
            <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="flex gap-0.5" aria-hidden="true">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" />
                ))}
              </span>
              <span className="tv-mono !text-[#F1F3F1] !tracking-[0.08em]">4.9/5</span>
              <span className="tv-small">Trusted by 10,000+ professionals</span>
            </motion.div>
          </motion.div>

          {/* RIGHT - The object itself */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.320, 1] }}
            className="lg:col-span-7 overflow-visible"
          >
            {/* The card sits square and static — no rotation, no drag, no
                pointer tracking. The only motion is the ambient glow behind it
                and one slow sheen sweep, both pure CSS on transform/opacity
                and both dropped under prefers-reduced-motion. See NFC CARD
                STAGE in globals.css. */}
            <NFCCard
              variant="obsidian"
              label="Obsidian Dark"
              size="hero"
              glow
              {...NFC_CARD_DEMO}
            />

            <div className="mt-10 lg:mt-12 mx-auto max-w-[420px] lg:max-w-none lg:px-10">
              <hr className="tv-rule mb-5" />
              <dl className="grid grid-cols-3 gap-4">
                {cardSpecs.map((spec) => (
                  <div key={spec.label}>
                    <dt className="tv-mono mb-1.5">{spec.label}</dt>
                    <dd className="tv-small !text-[#F1F3F1] font-medium">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
