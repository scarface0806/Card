'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Smartphone, Zap, Shield, Globe, BarChart3, Lock, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

const features = [
  {
    icon: Smartphone,
    title: 'Mobile First',
    description: 'Fully responsive design that works perfectly on all devices',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Instant loading with optimized performance and zero lag',
  },
  {
    icon: Shield,
    title: 'Secure',
    description: 'Bank-level encryption protects your personal information',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Connect with anyone, anywhere in the world instantly',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description: 'Track interactions and get insights about your network',
  },
  {
    icon: Lock,
    title: 'Privacy First',
    description: 'You control who sees what on your digital card',
  },
];

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
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export default function FeaturesSection() {
  return (
    <section className="section-spacing section-warm">
      <div className="site-container">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          <div className="section-badge">
            <span>Why Choose Us</span>
          </div>
          
          <h2 className="heading-1 section-title font-space-grotesk">
            Powerful{' '}
            <span className="text-gradient">Features</span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 section-subtitle">
            Everything you need to make a lasting impression
          </p>
        </motion.div>

        {/* Features Grid - 3 columns */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -4, scale: 1.02 }}
                className="card card-padding bg-white"
              >
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-5 md:mb-6">
                  <Icon className="w-6 h-6 md:w-7 md:h-7 text-teal-600" />
                </div>
                <h3 className="heading-3 text-[#0f2e25] font-space-grotesk mb-2 md:mb-3">{feature.title}</h3>
                <p className="body-base text-[#4b635d]">{feature.description}</p>
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
              Get Your Card Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
          <p className="body-base text-gray-500 mt-3"><a href="/preview-website" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700">Free Lifetime Website</a></p>
        </motion.div>
      </div>
    </section>
  );
}
