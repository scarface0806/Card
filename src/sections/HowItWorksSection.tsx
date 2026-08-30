'use client';

import MotionLink from '@/components/MotionLink';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

const steps = [
  {
    title: 'Build your profile',
    description:
      'Add your details, links and photo. It takes a few minutes, and you can change any of it later.',
    number: '01',
  },
  {
    title: 'We program the chip',
    description:
      'Your card is encoded with your live profile and printed in the finish you picked.',
    number: '02',
  },
  {
    title: 'Tap to share',
    description:
      'Hold the card to any phone. Your profile opens straight away — no app on either side.',
    number: '03',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export default function HowItWorksSection() {
  return (
    <section className="tv-surface-graphite tv-section">
      <div className="site-container">
        {/* Asymmetric split: the heading stays left and sticks while the
            numbered rows scroll past it. Deliberately not the centred
            badge / two-tone heading / 3-card grid shape. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4"
          >
            <div className="lg:sticky lg:top-32">
              <p className="tv-eyebrow mb-6">How it works</p>
              <h2 className="tv-h2 mb-5">Three steps, then you stop typing your details.</h2>
              <p className="tv-body tv-measure-body">
                Set it up once. The card does the rest for as long as you carry it.
              </p>

              <div className="mt-8 hidden lg:block">
                <MotionLink
                  href={ROUTES.CREATE_CARD}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  className="tv-btn tv-btn-primary"
                >
                  Get your card
                  <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                </MotionLink>
                <p className="tv-small mt-3">Takes less than 5 minutes.</p>
              </div>
            </div>
          </motion.div>

          <motion.ol
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="tv-steps lg:col-span-8"
          >
            {steps.map((step) => (
              <motion.li key={step.number} variants={itemVariants} className="tv-step">
                <span className="tv-step-num" aria-hidden="true">
                  {step.number}
                </span>
                <h3 className="tv-h3">{step.title}</h3>
                <p className="tv-body">{step.description}</p>
              </motion.li>
            ))}
          </motion.ol>

          {/* Same CTA, shown below the list on narrow screens. */}
          <div className="lg:hidden">
            <MotionLink
              href={ROUTES.CREATE_CARD}
              whileHover={{ y: -2 }}
              whileTap={{ y: 0 }}
              className="tv-btn tv-btn-primary tv-btn-block"
            >
              Get your card
              <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
            </MotionLink>
            <p className="tv-small mt-3">Takes less than 5 minutes.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
