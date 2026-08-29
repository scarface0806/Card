'use client';

import { PHONE_DISPLAY, PHONE_E164, SUPPORT_EMAIL } from '@/lib/site-config';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, Phone, ArrowRight, Home, Layout } from 'lucide-react';
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
    <main className="pt-32 pb-20 min-h-screen flex items-center bg-gradient-to-br from-[#020617] via-[#0b1220] to-[#111827]">
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
            <h1 className="text-4xl md:text-5xl font-bold text-white font-space-grotesk mb-4">
              Thank You!
            </h1>
            <p className="text-xl text-gray-400">
              Your digital business card has been successfully ordered
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-primary/10 border-2 border-primary/20 rounded-2xl p-8"
          >
            <p className="text-gray-300 text-sm mb-2">Your Order ID</p>
            <p className="text-3xl font-bold text-white font-mono">{orderId}</p>
            <p className="text-gray-300 text-sm mt-4">
              Save this ID for your records
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="card rounded-2xl p-8 space-y-6 text-left"
          >
            <h3 className="font-bold text-white font-space-grotesk text-lg">What's Next?</h3>

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
                <p className="text-gray-400 text-sm">
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
                <p className="text-gray-400 text-sm">
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
                <p className="text-gray-400 text-sm">
                  Your cards will be shipped within 7-10 business days
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-amber-500/10 border-2 border-amber-300/30 rounded-2xl p-6 space-y-3"
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
            <Link href={ROUTES.HOME}>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ y: 1 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                className="btn btn-lg btn-secondary w-full sm:w-auto"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </motion.button>
            </Link>
            <Link href={ROUTES.CARDS}>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ y: 1 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                className="btn btn-lg btn-primary w-full sm:w-auto"
              >
                <Layout className="w-4 h-4" />
                Browse More Templates
              </motion.button>
            </Link>
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
        <div className="pt-32 pb-20 min-h-screen flex items-center justify-center bg-gradient-to-br from-[#020617] via-[#0b1220] to-[#111827]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
        </div>
      }>
        <OrderSuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}
