'use client';

import { motion } from 'framer-motion';
import { Smartphone, Zap, Shield, Globe, BarChart3, Lock } from 'lucide-react';

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
    <section className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto max-w-6xl px-6 sm:px-8 md:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Small Label */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full mb-6">
            <span className="text-sm font-medium text-teal-700">Why Choose Us</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
            Powerful{' '}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-base md:text-lg text-[#4b635d] max-w-2xl mx-auto">
            Everything you need to make a lasting impression
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-8 border border-teal-100 shadow-md hover:shadow-lg hover:border-teal-200 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-teal-600" />
                </div>
                <h3 className="text-xl font-bold text-[#0f2e25] font-space-grotesk mb-3">{feature.title}</h3>
                <p className="text-[#4b635d] leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
