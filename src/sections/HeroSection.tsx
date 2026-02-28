'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowRight, Sparkles } from 'lucide-react';
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
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-white">
      <div className="w-full min-h-screen flex items-center">
        <div className="container mx-auto max-w-6xl px-6 sm:px-8 md:px-10 lg:px-12 py-16 lg:py-0">
          {/* 2-Column Grid Layout - Desktop: 45% / 55%, Mobile: stacked */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center min-h-screen lg:min-h-auto">
            {/* LEFT SIDE - Content (45% / 5 columns) */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-5 space-y-7 md:space-y-8 lg:space-y-9"
            >
              {/* Badge - Premium Label */}
              <motion.div variants={itemVariants}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-gray-300 transition-colors duration-300">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-widest">
                    Premium NFC Card
                  </span>
                </div>
              </motion.div>

              {/* Headline - Refined scale, tight line-height, intentional breaks */}
              <motion.div variants={itemVariants}>
                <h1 className="text-5xl sm:text-5xl lg:text-6xl font-black leading-tight lg:leading-[1.08] text-gray-900 tracking-tight">
                  Your Digital{' '}
                  <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                    Identity
                  </span>
                  <br className="hidden lg:block" />
                  Instantly Shareable
                </h1>
              </motion.div>

              {/* Subtext - Refined 18-20px, restrained */}
              <motion.p
                variants={itemVariants}
                className="text-base sm:text-lg lg:text-lg text-gray-600 leading-relaxed max-w-md font-light"
              >
                Encode your complete professional profile into an NFC chip. One tap connects you to your world.
              </motion.p>

              {/* Trust Metrics - Refined spacing and scale */}
              <motion.div
                variants={itemVariants}
                className="flex gap-8 sm:gap-10 pt-6 lg:pt-4"
              >
                <div>
                  <div className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">10K+</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">Active Users</div>
                </div>
                <div>
                  <div className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">50K+</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">Cards Shipped</div>
                </div>
                <div>
                  <div className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight">4.9★</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">Rating</div>
                </div>
              </motion.div>

              {/* CTA Buttons - Refined spacing */}
              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4 pt-6 lg:pt-4"
              >
                <Link href={ROUTES.ORDER}>
                  <motion.button
                    whileHover={{ y: -3, boxShadow: '0 16px 32px rgba(13, 148, 136, 0.12)' }}
                    whileTap={{ y: -1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="group inline-flex items-center justify-center gap-2 px-8 py-3 sm:py-3.5 rounded-lg font-semibold text-white text-base sm:text-base bg-gradient-to-r from-teal-600 to-emerald-500 hover:shadow-lg transition-all duration-300 whitespace-nowrap shadow-sm"
                  >
                    Order Now
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  </motion.button>
                </Link>

                <Link href={ROUTES.HOW_TO_USE}>
                  <motion.button
                    whileHover={{ boxShadow: '0 8px 16px rgba(0, 0, 0, 0.06)' }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="group inline-flex items-center justify-center gap-2 px-8 py-3 sm:py-3.5 rounded-lg font-semibold text-gray-900 text-base sm:text-base bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300 transition-all duration-300 whitespace-nowrap shadow-sm"
                  >
                    How It Works
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>

            {/* RIGHT SIDE - Card Showcase (55% / 7 columns) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.35, ease: [0.23, 1, 0.320, 1] }}
              className="lg:col-span-7 relative"
            >
              {/* Subtle Radial Background Gradient - for depth without obvious effect */}
              <div 
                className="absolute inset-0 -z-20 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 60% 50%, rgba(0,0,0,0.04), transparent 60%)',
                }}
              />

              {/* Ambient Glow - Very subtle, studio lighting effect */}
              <motion.div
                className="absolute -z-10 w-[450px] h-[450px] rounded-full blur-[140px] opacity-10 pointer-events-none -right-32 top-1/2 -translate-y-1/2"
                animate={{
                  scale: [0.9, 1.05, 0.9],
                  opacity: [0.08, 0.12, 0.08],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{
                  background: 'radial-gradient(circle, rgba(13, 148, 136, 0.15) 0%, transparent 70%)',
                }}
              />

              {/* Card Container - Premium shadow system + perspective */}
              <motion.div
                animate={{
                  rotateY: [1.5, -1.5, 1.5],
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="relative"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'perspective(1400px)',
                }}
              >
                {/* Premium Layered Shadow System */}
                <div 
                  className="absolute inset-0 rounded-3xl -z-10 pointer-events-none"
                  style={{
                    boxShadow: `
                      0px 40px 80px rgba(0, 0, 0, 0.12),
                      0px 20px 40px rgba(0, 0, 0, 0.08),
                      0px 1px 3px rgba(0, 0, 0, 0.05)
                    `,
                  }}
                />

                {/* Scale up card slightly for presence */}
                <div className="scale-100 sm:scale-105 origin-center">
                  <Card360Viewer />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
