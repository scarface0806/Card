'use client';

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
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.6 },
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
    <main className="pt-32 pb-20 min-h-screen flex items-center bg-gradient-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff]">
      <div className="container mx-auto max-w-3xl px-4 w-full lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: 0.2,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
            className="flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-200 rounded-full blur-2xl animate-pulse" />
              <CheckCircle className="w-24 h-24 text-emerald-500 relative" />
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <h1 className="text-4xl md:text-5xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
              Thank You!
            </h1>
            <p className="text-xl text-[#4b635d]">
              Your digital business card has been successfully ordered
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-8"
          >
            <p className="text-[#6b7f78] text-sm mb-2">Your Order ID</p>
            <p className="text-3xl font-bold text-[#0f2e25] font-mono">{orderId}</p>
            <p className="text-[#6b7f78] text-sm mt-4">
              Save this ID for your records
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl border border-teal-100 shadow-md p-8 space-y-6 text-left"
          >
            <h3 className="font-bold text-[#0f2e25] font-space-grotesk text-lg">What's Next?</h3>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-teal-600 text-white font-bold">
                  1
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-[#0f2e25] mb-1">
                  Confirmation Email
                </h4>
                <p className="text-[#4b635d] text-sm">
                  Check your email for order confirmation and tracking details
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-teal-600 text-white font-bold">
                  2
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-[#0f2e25] mb-1">
                  Card Production
                </h4>
                <p className="text-[#4b635d] text-sm">
                  We're preparing your cards with high-quality printing
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-teal-600 text-white font-bold">
                  3
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-[#0f2e25] mb-1">
                  Shipping
                </h4>
                <p className="text-[#4b635d] text-sm">
                  Your cards will be shipped within 7-10 business days
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 space-y-3"
          >
            <h4 className="font-semibold text-[#0f2e25]">Need Help?</h4>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <a
                href="mailto:support@tapvyo-nfc.com"
                className="flex items-center justify-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
              >
                <Mail className="w-4 h-4" />
                support@tapvyo-nfc.com
              </a>
              <a
                href="tel:+919999999999"
                className="flex items-center justify-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
              >
                <Phone className="w-4 h-4" />
                +91 9999999999
              </a>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
          >
            <Link href={ROUTES.HOME}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-[#4b635d] bg-white border border-teal-200 hover:bg-teal-50 rounded-xl font-semibold transition-all duration-300"
              >
                <Home className="w-4 h-4" />
                Back to Home
              </motion.button>
            </Link>
            <Link href={ROUTES.CARDS}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-semibold transition-all duration-300"
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
        <div className="pt-32 pb-20 min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-teal-600 border-t-transparent" />
        </div>
      }>
        <OrderSuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}
