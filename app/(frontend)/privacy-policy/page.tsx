'use client';

import { PHONE_DISPLAY, SUPPORT_EMAIL } from '@/lib/site-config';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';

/**
 * Hardcoded, NOT `new Date()`. Same reasoning as the other three policy pages:
 * a last-updated date has to be the date the policy actually changed, not the
 * date the visitor loaded it, and `new Date()` in a client component is a
 * hydration mismatch whenever server and browser disagree on timezone.
 *
 * This page's wording is unchanged by the profile-update rule; the date below
 * is simply the value the old `new Date()` was already rendering.
 *
 * BUMP THIS whenever the wording below changes.
 */
const LAST_UPDATED = 'September 5, 2026';

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
        `If you have any questions about this Privacy Policy, please contact us at: ${SUPPORT_EMAIL} or ${PHONE_DISPLAY}`,
    },
  ];

  return (
    <>
      <Navbar />
      <main className="tv-surface-bone tv-page-head pb-20 min-h-screen">
        <div className="site-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10"
          >
            <h1 className="tv-h2 mb-3">
              Privacy Policy
            </h1>
            <p className="tv-mono">
              Last updated: {LAST_UPDATED}
            </p>
          </motion.div>

          <div className="tv-prose">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="py-7 border-b border-[#12100C]/12 last:border-b-0"
              >
                <h2 className="tv-h3 mb-3">
                  {section.title}
                </h2>
                <p className="tv-body">
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

