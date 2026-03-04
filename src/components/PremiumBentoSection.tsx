'use client';

import { motion, easeOut } from 'framer-motion';
import { Zap, Shield, Smartphone, BarChart3, Lock, Layers } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import Heading from '@/components/Heading';
import Text from '@/components/Text';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: easeOut },
  },
};

const features = [
  {
    id: 1,
    title: 'Lightning Fast',
    description: 'One tap, instant connection. No app download required.',
    icon: Zap,
    span: 'md:col-span-2 md:row-span-2',
    size: 'large',
  },
  {
    id: 2,
    title: 'Bank-Level Security',
    description: 'Your data encrypted and protected.',
    icon: Shield,
    span: 'md:col-span-1',
    size: 'small',
  },
  {
    id: 3,
    title: 'Mobile Optimized',
    description: 'Perfect on any device.',
    icon: Smartphone,
    span: 'md:col-span-1',
    size: 'small',
  },
  {
    id: 4,
    title: 'Analytics Dashboard',
    description: 'Track every interaction.',
    icon: BarChart3,
    span: 'md:col-span-1',
    size: 'small',
  },
  {
    id: 5,
    title: 'Premium Support',
    description: 'We are here for you 24/7.',
    icon: Lock,
    span: 'md:col-span-1',
    size: 'small',
  },
  {
    id: 6,
    title: 'Advanced Customization',
    description: 'Make it uniquely yours.',
    icon: Layers,
    span: 'md:col-span-2',
    size: 'medium',
  },
];

export default function PremiumBentoSection() {
  return (
    <section className="relative py-20 md:py-32 bg-dark-bg overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 right-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Heading as="h2" className="mb-4">
            Why Choose Tapvyo?
          </Heading>
          <Text variant="body-lg" className="text-white/70 max-w-2xl mx-auto">
            Premium features designed for modern professionals
          </Text>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.id}
                variants={itemVariants}
                className={feature.span}
              >
                <GlassCard hover glow className="h-full">
                  <div className="flex flex-col h-full gap-4">
                    {/* Icon */}
                    <div className="w-12 h-12 bg-linear-to-br from-violet-600 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-space-grotesk font-semibold text-lg text-white mb-2">
                        {feature.title}
                      </h3>
                      <Text variant="body" className="text-white/60">
                        {feature.description}
                      </Text>
                    </div>

                    {/* Large card visual */}
                    {feature.size === 'large' && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-white/5 rounded-lg text-center">
                            <p className="text-2xl font-bold text-cyan-400">99.9%</p>
                            <p className="text-xs text-white/50 mt-1">Uptime</p>
                          </div>
                          <div className="p-3 bg-white/5 rounded-lg text-center">
                            <p className="text-2xl font-bold text-violet-400">10M+</p>
                            <p className="text-xs text-white/50 mt-1">Taps</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

