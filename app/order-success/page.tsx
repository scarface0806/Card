'use client';

import { PHONE_DISPLAY, PHONE_E164, SUPPORT_EMAIL } from '@/lib/site-config';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MotionLink from '@/components/MotionLink';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, Phone, Home, Layout } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || 'ORD-XXXX-XXXX';

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.32, ease: [0.25, 0.1, 0.25, 1] as const },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <main className="tv-hero pt-32 pb-20 min-h-screen flex items-center">
      <div className="site-container w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-8"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.1,
              duration: 0.32,
              ease: [0.25, 0.1, 0.25, 1] as const,
            }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-secondary/15 rounded-full blur-2xl animate-pulse" />
              <CheckCircle className="w-24 h-24 text-primary relative" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h1 className="tv-h2 mb-4">
              Thank You!
            </h1>
            <p className="tv-lead">
              Your digital business card has been successfully ordered
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="tv-panel tv-panel-pad"
          >
            <p className="tv-mono mb-2">Your order ID</p>
            <p className="text-3xl font-bold text-white font-mono">{orderId}</p>
            <p className="tv-small mt-4">
              Save this ID for your records
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="tv-panel tv-panel-pad space-y-6 text-left"
          >
            <h3 className="tv-h4">What's Next?</h3>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white font-bold">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">
                  Confirmation Email
                </h4>
                <p className="tv-small">
                  Check your email for order confirmation and tracking details
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">
                  Card Production
                </h4>
                <p className="tv-small">
                  We're preparing your cards with high-quality printing
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">
                  Shipping
                </h4>
                <p className="tv-small">
                  Your cards will be shipped within 7-10 business days
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="border-l-2 border-[#C9A961] pl-5 py-1 space-y-3 text-left"
          >
            <h4 className="font-semibold text-white">Need Help?</h4>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center justify-center gap-2 text-primary hover:text-primary font-medium"
              >
                <Mail className="w-4 h-4" />
                {SUPPORT_EMAIL}
              </a>
              <a
                href={`tel:${PHONE_E164}`}
                className="flex items-center justify-center gap-2 text-primary hover:text-primary font-medium"
              >
                <Phone className="w-4 h-4" />
                {PHONE_DISPLAY}
              </a>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
          >
            <MotionLink href={ROUTES.HOME}
                whileHover={{ y: -2 }}
                whileTap={{ y: 1 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                className="tv-btn tv-btn-lg tv-btn-secondary tv-btn-block"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </MotionLink>
            <MotionLink href={ROUTES.CARDS}
                whileHover={{ y: -2 }}
                whileTap={{ y: 1 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block"
              >
                <Layout className="w-4 h-4" />
                Browse More Templates
              </MotionLink>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={
        <div className="tv-hero pt-32 pb-20 min-h-screen flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      }>
        <OrderSuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}
