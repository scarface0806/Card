'use client';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: '1. Introduction',
      content:
        'Tapvyo ("we", "us", "our", or "Company") operates the Tapvyo website and mobile application. This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our service and the choices you have associated with that data.',
    },
    {
      title: '2. Information Collection and Use',
      content:
        'We collect several different types of information for various purposes to provide and improve our service to you. When you create an account or place an order, we collect your name, email address, phone number, and address. Your card details, business information, and uploaded images are collected to customize your digital business card. We also automatically collect usage data such as your IP address, browser type, and pages visited.',
    },
    {
      title: '3. Use of Data',
      content:
        'Tapvyo uses the collected data for various purposes: to provide and maintain our service, to notify you about changes to our service, to allow you to participate in interactive features, to provide customer support, to gather analysis or valuable information to improve our service, to monitor the usage of our service, and to detect, prevent and address technical and security issues.',
    },
    {
      title: '4. Security',
      content:
        'The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal data, we cannot guarantee its absolute security.',
    },
    {
      title: '5. Changes to This Privacy Policy',
      content:
        'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.',
    },
    {
      title: '6. Contact Us',
      content:
        'If you have any questions about this Privacy Policy, please contact us at: support@tapvyo-nfc.com or +91 9999999999',
    },
  ];

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 min-h-screen bg-linear-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff]">
        <div className="site-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-[#0f2e25] mb-4 font-space-grotesk">
              Privacy Policy
            </h1>
            <p className="text-[#4b635d]">
              Last updated: {new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </motion.div>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl p-8 border border-teal-100 shadow-sm"
              >
                <h2 className="text-2xl font-bold text-[#0f2e25] mb-4 font-space-grotesk">
                  {section.title}
                </h2>
                <p className="text-[#4b635d] leading-relaxed">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

