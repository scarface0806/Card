'use client';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';

/**
 * Hardcoded, NOT `new Date()`. A policy's last-updated date has to be the date
 * the terms actually changed, not the date the visitor happened to load the
 * page - and rendering today's date inside a client component is a hydration
 * mismatch waiting to happen when server and browser disagree on timezone.
 * Same reasoning, and the same constant, as /refund-policy and /shipping-policy.
 *
 * BUMP THIS whenever the wording below changes.
 */
const LAST_UPDATED = 'September 5, 2026';

/**
 * `bullets` mirrors the shape /refund-policy and /shipping-policy already use,
 * so the three policy pages stay one object. `.tv-prose li` is defined in
 * globals.css, so the list inherits this page's typography and introduces no
 * new styling.
 */
type Section = {
  title: string;
  content?: string;
  bullets?: string[];
};

export default function TermsPage() {
  const sections: Section[] = [
    {
      title: '1. Agreement to Terms',
      content:
        'These Terms and Conditions constitute a legally binding agreement made between you and Tapvyo. By accessing and using this service, you accept and agree to be bound by and comply with these terms and conditions.',
    },
    {
      title: '2. Use License',
      content:
        'Permission is granted to temporarily download one copy of the materials (information or software) on Tapvyo\' (the "Site") for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials; use the materials for any commercial purpose or for any public display; attempt to decompile or reverse engineer any software contained on the Site; remove any copyright or other proprietary notations from the materials; or transfer the materials to another person or "mirror" the materials on any other server.',
    },
    {
      title: '3. Disclaimer',
      content:
        'The materials on Tapvyo\'s Site are provided on an \'as is\' basis. Tapvyo makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.',
    },
    {
      title: '4. Limitations',
      content:
        'In no event shall Tapvyo or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Tapvyo\'s Site.',
    },
    {
      title: '5. Accuracy of Materials',
      content:
        'The materials appearing on Tapvyo\'s Site could include technical, typographical, or photographic errors. Tapvyo does not warrant that any of the materials on the Site are accurate, complete, or current. Tapvyo may make changes to the materials contained on its Site at any time without notice.',
    },
    {
      title: '6. Links',
      content:
        'Tapvyo has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by Tapvyo of the site. Use of any such linked website is at the user\'s own risk.',
    },
    {
      // The turnaround (1 working day), the error-correction window (7 days)
      // and the bulk exemption (3 free updates) were all confirmed by the
      // owner on 5 September 2026. These are published terms now, not
      // placeholders - do not change them without the same sign-off.
      //
      // The bulk bullet must stay in step with the three "updated 3 times
      // free" bullets in src/sections/OtherCardsSolutionsSection.tsx. If one
      // changes, change the other.
      title: '7. Profile Updates and Edit Charges',
      content:
        'Your digital profile is created by Tapvyo using the details you submit at the time of ordering. Updating a profile does not require reprinting your card, as the link encoded on the NFC chip does not change.',
      bullets: [
        'Profiles are not self-editable. There is no customer-facing editor, and changes to a published profile are made by our team on request.',
        'Any change to your profile after the order is placed must be requested from Tapvyo directly. Update requests are accepted on WhatsApp at +91 78713 61025. Please include your Order ID and the details you want changed.',
        'Each update request is charged ₹49 (inclusive of applicable taxes), payable before the update is made. One request covers the set of changes submitted in that single message.',
        'Update requests are processed within 1 working day of payment being received.',
        'The ₹49 charge applies per request, not per field. If further changes are requested later, a fresh ₹49 charge applies.',
        'Tapvyo may decline an update request that involves unlawful, misleading, offensive or third-party-infringing content.',
        'Corrections to errors caused by Tapvyo during profile creation are made free of charge, provided they are reported within 7 days of your profile link being delivered.',
        'Bulk and institutional orders (school, corporate and team cards) include 3 free update requests. Further updates are charged ₹49 each. Any different terms stated in your order confirmation take precedence.',
      ],
    },
    {
      title: '8. Modifications',
      content:
        'Tapvyo may revise these terms and conditions for its Site at any time without notice. By using this Site, you are agreeing to be bound by the then current version of these terms and conditions.',
    },
    {
      title: '9. Governing Law',
      content:
        'These terms and conditions are governed by and construed in accordance with the laws of India, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.',
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
              Terms &amp; Conditions
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
                {section.content && (
                  <p className="tv-body">
                    {section.content}
                  </p>
                )}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

