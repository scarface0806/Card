'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/utils/constants';

const faqItems = [
  {
    id: 'q1',
    title: 'What is NFC technology?',
    content:
      'NFC (Near Field Communication) is a technology that allows two devices to communicate when they are brought close together. Our cards use this technology to instantly share your contact information when a customer taps their phone.',
  },
  {
    id: 'q2',
    title: 'Will this work with all phones?',
    content:
      'Yes! NFC is compatible with most modern smartphones including all iPhones (iPhone 6 and later) and Android devices. Your customers simply tap their phone to their card to access your information.',
  },
  {
    id: 'q3',
    title: 'How do I update my information?',
    content:
      'You can update your information anytime from your dashboard. Changes are reflected instantly. No need to reorder cards or worry about outdated contact details.',
  },
  {
    id: 'q4',
    title: 'Can I choose a different design?',
    content:
      'Absolutely! We offer multiple premium templates designed by professionals. You can fully customize colors, fonts, and layout to match your brand. Choose from 12+ beautiful designs.',
  },
  {
    id: 'q5',
    title: 'What about security and privacy?',
    content:
      'We use bank-level encryption to protect your data. You maintain full control over what information is shared. Your personal data is never shared with third parties.',
  },
  {
    id: 'q6',
    title: 'How long does delivery take?',
    content:
      'Standard delivery takes 7-10 business days within India. Express delivery (3-5 days) is available for an additional charge. International shipping is available on request.',
  },
];

export default function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="tv-surface-bone tv-section relative w-full overflow-hidden">
      <div className="site-container relative z-10">
        {/* Editorial split: heading left, answers right. The accordion is set
            on paper as flat rules rather than a stack of floating pills. */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="lg:col-span-4"
          >
            <div className="lg:sticky lg:top-32">
              <p className="tv-eyebrow mb-6">Questions</p>
              <h2 className="tv-h2 mb-4">Before you order.</h2>
              <p className="tv-body mb-8">
                Still stuck? We answer within one working day.
              </p>
              <Link href={ROUTES.CONTACT} className="tv-btn-tertiary">
                Talk to our team
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-8"
          >
            {faqItems.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className="tv-accordion-item">
                  <h3>
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${item.id}`}
                      id={`faq-trigger-${item.id}`}
                      className="tv-accordion-trigger tv-focus"
                    >
                      {item.title}
                      <span className="tv-accordion-icon" aria-hidden="true">
                        <ChevronDown className="w-4 h-4" strokeWidth={2} />
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="panel"
                        id={`faq-panel-${item.id}`}
                        role="region"
                        aria-labelledby={`faq-trigger-${item.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="tv-accordion-panel">{item.content}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
