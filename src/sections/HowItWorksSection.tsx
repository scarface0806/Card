'use client';

import { motion } from 'framer-motion';
import { UserPlus, Cpu, Share2 } from 'lucide-react';

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
    <section className="relative py-16 md:py-20 lg:py-24 bg-white overflow-hidden">
      {/* Subtle background gradient - minimal */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 via-white to-white pointer-events-none" />

      <div className="relative container mx-auto max-w-6xl px-6 sm:px-8 md:px-10 lg:px-12">
        {/* Header - Centered */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-14"
        >
          {/* Small Label */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-full mb-4">
            <span className="text-xs font-semibold text-teal-700 uppercase tracking-wide">How It Works</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f2e25] font-space-grotesk leading-tight mb-4">
            NFC Sharing in{' '}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              3 Simple Steps
            </span>
          </h2>

          {/* Subheading */}
          <p className="text-base md:text-lg text-[#4b635d] max-w-2xl mx-auto leading-relaxed">
            Set up your digital profile and start sharing instantly.
          </p>
        </motion.div>

        {/* Steps Grid - Clean 3 Column Layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{
                  y: -6,
                  transition: { duration: 0.2 },
                }}
                className="group relative"
              >
                {/* Premium Card */}
                <div className="h-full bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-lg transition-shadow duration-200">
                  {/* Step Badge - Top Right Corner */}
                  <div className="absolute top-6 right-6">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-50 border border-teal-200">
                      <span className="text-xs font-bold text-teal-700">{index + 1}</span>
                    </div>
                  </div>

                  {/* Icon Container - Top */}
                  <motion.div
                    className="flex items-center justify-center mb-6"
                    whileHover={{
                      scale: 1.08,
                      transition: { duration: 0.2 },
                    }}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/30 group-hover:shadow-teal-500/50 transition-shadow duration-200">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  </motion.div>

                  {/* Title - Middle */}
                  <h3 className="text-xl font-bold text-[#0f2e25] mb-3 text-center leading-snug">
                    {step.title}
                  </h3>

                  {/* Description - Below */}
                  <p className="text-[#4b635d] text-center leading-relaxed text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
