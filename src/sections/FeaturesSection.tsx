'use client';

import MotionLink from '@/components/MotionLink';
import { motion } from 'framer-motion';
import { Smartphone, Zap, Shield, Globe, BarChart3, Lock, ArrowUpRight } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

// `span` drives the bento layout: the first tile is wide, the rest sit in a
// tighter rhythm beside it, so this reads as a composed block rather than
// another uniform three-across grid.
const features = [
  {
    icon: Zap,
    title: 'Opens instantly',
    description:
      'A tap loads your profile in about a second. Nothing to download, nothing to scan.',
    span: 'md:col-span-2',
  },
  {
    icon: Smartphone,
    title: 'Works on any phone',
    description: 'Built for every screen size, from an old handset to the newest flagship.',
    span: '',
  },
  {
    icon: Globe,
    title: 'Share anywhere',
    description: 'One link that works worldwide, whoever you hand the card to.',
    span: '',
  },
  {
    icon: BarChart3,
    title: 'See who tapped',
    description: 'Track opens and follow up on the connections that matter.',
    span: '',
  },
  {
    icon: Shield,
    title: 'Encrypted',
    description: 'Bank-level encryption protects your personal information.',
    span: '',
  },
  {
    icon: Lock,
    title: 'You choose what shows',
    description: 'Every field is yours to publish or keep private. You tell us what the tap should show.',
    span: 'md:col-span-2',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
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

export default function FeaturesSection() {
  return (
    <section id="features" className="tv-surface-ink tv-section">
      <div className="site-container">
        {/* Heading sits left, not centred — the centred-header shape is used
            once on this page now, in the finishes section. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-12 md:mb-16"
        >
          <p className="tv-eyebrow mb-6">What you get</p>
          <h2 className="tv-h2 mb-4">Everything the paper card never did.</h2>
          <p className="tv-lead tv-measure-body">
            One card, one profile, and full control over what it shows.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className={`tv-panel tv-panel-pad flex flex-col ${feature.span}`}
              >
                <Icon
                  className="w-5 h-5 mb-5 text-[#C9A961]"
                  strokeWidth={1.6}
                  aria-hidden="true"
                />
                <h3 className="tv-h4 mb-2">{feature.title}</h3>
                <p className="tv-small">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 md:mt-14 flex flex-col sm:flex-row sm:items-center gap-x-6 gap-y-4"
        >
          <MotionLink
            href={ROUTES.CREATE_CARD}
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            className="tv-btn tv-btn-lg tv-btn-gilded tv-btn-block"
          >
            Get your card
            <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
          </MotionLink>
          {/* The old line read "No hidden charges. No renewal fees." Profile
              updates are ₹49 each, so the fee is stated here rather than left
              for the customer to discover later. */}
          <p className="tv-small">
            One-time payment. No renewal fees. Profile updates ₹49 each.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
