'use client';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';
import { User, Globe, Wifi, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/utils/constants';

export default function HowToUsePage() {
  const steps = [
    {
      number: '01',
      title: 'Submit Your Details',
      description:
        "Share your name, bio, social links, contact details, and business information with us. We'll create your personalized digital profile.",
      icon: User,
      highlight: null,
    },
    {
      number: '02',
      title: 'We Create Your Lifetime Digital Website',
      description:
        'We build a fully responsive digital profile website for you — completely free and valid for lifetime. Your profile can showcase your bio, services, social links, and more.',
      icon: Globe,
      highlight: 'Free Lifetime Website Included',
    },
    {
      number: '03',
      title: 'We Program Your NFC Card',
      description:
        'We securely encode your personal website link into your NFC card. When someone taps your card on their phone, your digital profile opens instantly.',
      icon: Wifi,
      highlight: 'No app required. Just tap and share.',
    },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <>
      <Navbar />
      <main className="bg-gradient-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff] min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 md:pt-44 md:pb-24 overflow-hidden">
          {/* Background decorations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 right-10 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl" />
          </div>

          <div className="site-container text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full text-sm font-semibold text-teal-700">
                <Sparkles className="w-4 h-4" />
                How It Works
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold mb-6 text-[#0f2e25] font-space-grotesk leading-tight"
            >
              Your NFC Digital Card in{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                3 Simple Steps
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-[#4b635d] max-w-2xl mx-auto leading-relaxed"
            >
              A modern way to share your professional identity instantly.
            </motion.p>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-16 md:py-24">
          <div className="site-container">
            <div className="space-y-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="relative bg-white rounded-3xl p-8 md:p-12 shadow-lg border border-teal-100/50 hover:shadow-xl transition-shadow duration-300"
                >
                  <div className="flex flex-col md:flex-row items-start gap-6 md:gap-10">
                    {/* Icon */}
                    <div className="shrink-0">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 flex items-center justify-center shadow-sm">
                        <step.icon className="w-8 h-8 md:w-10 md:h-10 text-teal-600" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      {/* Step number */}
                      <span className="inline-block text-sm font-bold text-teal-600 uppercase tracking-wider mb-2">
                        Step {step.number}
                      </span>

                      <h3 className="text-2xl md:text-3xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
                        {step.title}
                      </h3>

                      <p className="text-lg text-[#4b635d] leading-relaxed mb-4 max-w-2xl">
                        {step.description}
                      </p>

                      {step.highlight && (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-full">
                          <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          <span className="text-sm font-semibold text-teal-700">
                            {step.highlight === 'Free Lifetime Website Included' ? (
                              <a href="/preview-website" target="_blank" rel="noopener noreferrer" className="hover:text-teal-800">Free Lifetime Website</a>
                            ) : step.highlight}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Connecting line (except for last item) */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute -bottom-8 left-[2.5rem] md:left-[3.25rem] w-0.5 h-8 bg-gradient-to-b from-teal-200 to-transparent" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="site-container">
            <motion.div
              {...fadeInUp}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
                Designed for Modern Professionals
              </h2>
              <p className="text-lg text-[#4b635d] max-w-2xl mx-auto leading-relaxed">
                Perfect for entrepreneurs, executives, creators, and business leaders.
                Share your bio, services, and contact details effortlessly in one tap.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {[
                { label: 'Entrepreneurs', icon: '🚀' },
                { label: 'Executives', icon: '💼' },
                { label: 'Creators', icon: '🎨' },
                { label: 'Business Leaders', icon: '📈' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow duration-300"
                >
                  <span className="text-3xl mb-3 block">{item.icon}</span>
                  <span className="text-sm font-semibold text-[#0f2e25]">{item.label}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Customization CTA Section */}
        <section className="py-16 md:py-24">
          <div className="site-container">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative bg-gradient-to-br from-teal-700 to-emerald-600 rounded-3xl p-10 md:p-16 text-center overflow-hidden"
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white font-space-grotesk mb-4">
                  Need Customization?
                </h2>
                <p className="text-lg text-teal-100 max-w-xl mx-auto mb-8 leading-relaxed">
                  You can upgrade or customize your digital profile anytime.
                  Contact our team to modify design, add features, or personalize your NFC experience.
                </p>
                <Link href={ROUTES.CONTACT}>
                  <button className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-700 font-semibold rounded-full hover:bg-teal-50 transition-all duration-220 shadow-lg hover:shadow-xl hover:-translate-y-1 group">
                    <span>Contact Us</span>
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-24 bg-white">
          <div className="site-container text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-[#4b635d] mb-8 max-w-xl mx-auto">
                Order your premium NFC digital business card today and start networking smarter.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href={ROUTES.CREATE_CARD}>
                  <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 hover:shadow-lg text-white font-semibold rounded-full transition-all duration-220 shadow-md hover:-translate-y-1 group">
                    <span>Create Your Card</span>
                    <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </Link>
                <Link href={ROUTES.CARDS}>
                  <button className="inline-flex items-center gap-2 px-8 py-4 border-2 border-teal-200 text-teal-700 hover:border-teal-300 hover:bg-teal-50 font-semibold rounded-full transition-all duration-300">
                    View Card Designs
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

