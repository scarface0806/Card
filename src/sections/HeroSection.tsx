'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight, Sparkles, Check, Star } from 'lucide-react';
import { ROUTES } from '@/utils/constants';
import Card360Viewer from '@/components/Card360Viewer';

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
    transition: { duration: 0.6, ease: [0.23, 1, 0.320, 1] },
  },
};

export default function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center bg-white overflow-visible">
      <div className="site-container py-24 lg:py-0 overflow-visible">
        {/* 12-column grid: 5 columns left, 7 columns right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* LEFT - Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 space-y-5 md:space-y-6"
          >
            {/* Social Proof Badge */}
            <motion.div variants={itemVariants} className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-sm font-semibold text-gray-700">4.9/5</span>
              <span className="text-sm text-gray-500">• Trusted by 10,000+ professionals</span>
            </motion.div>

            {/* Headline - Value-focused */}
            <motion.div variants={itemVariants}>
              <h1 className="heading-display text-gray-900">
                Share Your Contact{' '}
                <span className="text-gradient">Instantly</span>
                <br />
                With One Tap
              </h1>
            </motion.div>

            {/* Subtext - Outcome focused */}
            <motion.p variants={itemVariants} className="body-lg text-gray-600 max-w-md">
              Turn every handshake into a lasting connection. Your NFC card shares your complete profile in seconds — no apps needed.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href={ROUTES.CREATE_CARD}>
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ y: 1 }}
                  className="btn btn-lg btn-primary w-full sm:w-auto"
                >
                  Get Your NFC Card
                  <ArrowUpRight className="w-5 h-5" />
                </motion.button>
              </Link>

              <Link href={ROUTES.HOW_TO_USE}>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  className="btn btn-lg btn-secondary w-full sm:w-auto"
                >
                  See How It Works
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </motion.div>

            {/* Trust Signals */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-teal-600" />
                <a href="/preview-website" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700">Free Lifetime Website</a>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-teal-600" />
                <span>No Renewal Fees</span>
              </div>
            </motion.div>
          </motion.div>

          {/* RIGHT - Card Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.320, 1] }}
            className="lg:col-span-7 flex items-center justify-center overflow-visible"
          >
            <div className="w-full overflow-visible">
              <Card360Viewer />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
