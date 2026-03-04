'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

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
    <section className="relative w-full section-spacing overflow-hidden bg-white">
      {/* Content Container */}
      <div className="site-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="section-header"
        >
          <h2 className="heading-1 section-title font-space-grotesk">
            Frequently Asked{' '}
            <span className="text-gradient">
              Questions
            </span>
          </h2>
          <p className="body-lg section-subtitle">
            Everything you need to know about Tapvyo NFC cards
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="space-y-3 md:space-y-4"
        >
          {faqItems.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="group"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full flex items-center justify-between px-6 md:px-7 py-5 md:py-6 text-left
                  bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300
                  rounded-xl md:rounded-2xl transition-all duration-300
                  hover:shadow-md"
              >
                {/* Question Text */}
                <span className="body-lg font-semibold text-gray-900 pr-4 leading-relaxed hover:text-teal-700 transition-colors duration-300">
                  {item.title}
                </span>

                {/* Chevron Icon */}
                <motion.div
                  animate={{ rotate: openId === item.id ? 180 : 0 }}
                  transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-teal-100 transition-all duration-300"
                >
                  <ChevronDown className="w-5 h-5 text-teal-600" />
                </motion.div>
              </button>

              {/* Answer Content */}
              <AnimatePresence>
                {openId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 md:px-7 py-5 md:py-6 body-base text-gray-700 leading-relaxed
                      border-t border-gray-200 mt-0.5 ml-0 mr-0
                      bg-gray-50 rounded-b-xl md:rounded-b-2xl">
                      {item.content}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-14 md:mt-16 text-center"
        >
          <p className="body-base text-gray-600 mb-4">Still have questions?</p>
          <a
            href="#contact"
            className="inline-block px-8 py-3 bg-gradient-to-r from-teal-600 to-emerald-500 text-white font-semibold
              rounded-xl hover:shadow-lg transition-all duration-220 hover:-translate-y-1"
          >
            Get in Touch
          </a>
        </motion.div>
      </div>
    </section>
  );
}

