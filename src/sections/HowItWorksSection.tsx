'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserPlus, Cpu, Share2, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

const steps = [
  {
    icon: UserPlus,
    title: 'Create Your Profile',
    description: 'Fill in your details and customize your NFC card in minutes.',
    number: '01',
  },
  {
    icon: Cpu,
    title: 'We Program Your Card',
    description: 'We securely encode your live profile into the NFC chip.',
    number: '02',
  },
  {
    icon: Share2,
    title: 'Tap & Share Instantly',
    description: 'Anyone can tap your card and access your profile immediately.',
    number: '03',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
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
    <section className="relative section-spacing section-alt overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-white to-white pointer-events-none" />

      <div className="relative site-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <div className="section-badge">
            <span>How It Works</span>
          </div>

          <h2 className="heading-1 section-title font-space-grotesk">
            NFC Sharing in{' '}
            <span className="text-gradient">3 Simple Steps</span>
          </h2>

          <p className="text-sm md:text-base text-slate-500 section-subtitle">
            Set up your digital profile and start sharing instantly.
          </p>
        </motion.div>

        {/* Steps Grid - 3 columns */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="group relative"
              >
                <div className="h-full card card-padding hover:shadow-xl transition-all duration-300">
                  {/* Icon */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary" />
                    </div>
                  </div>

                  <h3 className="heading-3 text-[#0f2e25] mb-2 md:mb-3 text-center">
                    {step.title}
                  </h3>

                  <p className="body-base text-[#4b635d] text-center">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-12 md:mt-16"
        >
          <Link href={ROUTES.CREATE_CARD}>
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ y: 1 }}
              className="btn btn-lg btn-primary"
            >
              Start Creating Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
          <p className="body-base text-gray-500 mt-3">Takes less than 5 minutes</p>
        </motion.div>
      </div>
    </section>
  );
}

