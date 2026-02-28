'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import Button from '@/components/Button';
import { motion } from 'framer-motion';
import { CheckCircle, Mail, Phone } from 'lucide-react';
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
    <main className="pt-32 pb-20 min-h-screen flex items-center">
      <div className="container mx-auto max-w-3xl px-4 w-full">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-8"
        >
            {/* Success Icon */}
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
                <div className="absolute inset-0 bg-green-200 rounded-full blur-2xl animate-pulse" />
                <CheckCircle className="w-24 h-24 text-green-600 relative" />
              </div>
            </motion.div>

            {/* Main Message */}
            <motion.div variants={itemVariants}>
              <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
                Thank You!
              </h1>
              <p className="text-xl text-gray-600">
                Your digital business card has been successfully ordered
              </p>
            </motion.div>

            {/* Order ID */}
            <motion.div
              variants={itemVariants}
              className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8"
            >
              <p className="text-gray-600 text-sm mb-2">Your Order ID</p>
              <p className="text-3xl font-bold text-black font-mono">{orderId}</p>
              <p className="text-gray-500 text-sm mt-4">
                Save this ID for your records
              </p>
            </motion.div>

            {/* Details */}
            <motion.div
              variants={itemVariants}
              className="bg-gray-50 rounded-xl p-8 space-y-6 text-left"
            >
              <h3 className="font-bold text-black text-lg">What's Next?</h3>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    1
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">
                    Confirmation Email
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Check your email for order confirmation and tracking details
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    2
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">
                    Card Production
                  </h4>
                  <p className="text-gray-600 text-sm">
                    We're preparing your cards with high-quality printing
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 text-white font-bold">
                    3
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-1">
                    Shipping
                  </h4>
                  <p className="text-gray-600 text-sm">
                    Your cards will be shipped within 7-10 business days
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Contact Support */}
            <motion.div
              variants={itemVariants}
              className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 space-y-3"
            >
              <h4 className="font-semibold text-black">Need Help?</h4>
              <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                <a
                  href="mailto:support@tapvyo-nfc.com"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Mail className="w-4 h-4" />
                  support@tapvyo-nfc.com
                </a>
                <a
                  href="tel:+919999999999"
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Phone className="w-4 h-4" />
                  +91 9999999999
                </a>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
            >
              <Link href={ROUTES.HOME}>
                <Button variant="outline" size="lg">
                  Back to Home
                </Button>
              </Link>
              <Link href={ROUTES.CARDS}>
                <Button variant="secondary" size="lg">
                  Browse More Templates
                </Button>
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
      <Suspense fallback={<div className="pt-32 pb-20 min-h-screen flex items-center justify-center">Loading...</div>}>
        <OrderSuccessContent />
      </Suspense>
      <Footer />
    </>
  );
}
