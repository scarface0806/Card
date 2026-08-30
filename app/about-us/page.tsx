'use client';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';
import { ArrowUpRight, Users, Zap, Target } from 'lucide-react';
import Link from 'next/link';
import MotionLink from '@/components/MotionLink';
import { ROUTES } from '@/utils/constants';

export default function AboutUsPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  const values = [
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Cutting-edge NFC technology meets elegant design in every card',
      color: 'bg-primary',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a global network of professionals sharing seamlessly',
      color: 'bg-primary',
    },
    {
      icon: Target,
      title: 'Simplicity',
      description: 'Complex technology made simple for everyone',
      color: 'bg-primary',
    },
  ];

  const stats = [
    { number: '10K+', label: 'Active Users' },
    { number: '50K+', label: 'Cards Created' },
    { number: '95%', label: 'Satisfaction Rate' },
    { number: '24/7', label: 'Support' },
  ];

  return (
    <div className="frontend-dark">
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="tv-hero tv-page-head pb-16 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-secondary/15 rounded-full blur-3xl" />
          </div>

          <div className="site-container">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <motion.div variants={itemVariants} className="mb-8">
                <span className="tv-eyebrow tv-eyebrow--center">About our mission</span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="tv-display mx-auto mb-6">
                Revolutionizing{' '}
                <span className="text-primary">
                  Connection
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="tv-lead mb-8 max-w-2xl mx-auto">
                We're building the future of professional connections through intelligent NFC technology. One tap, endless possibilities.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Our Story */}
        <section className="tv-surface-bone tv-section">
          <div className="site-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div>
                <h2 className="tv-h2 mb-5">Our Story</h2>
                <p className="tv-body mb-4">
                  Tapvyo was born from a simple observation: connecting professionals should be effortless. We realized that traditional business cards are outdated, and digital alternatives were too complicated.
                </p>
                <p className="tv-body mb-7">
                  Our team of engineers and designers worked tirelessly to create the perfect blend of technology and elegance. The result? A seamless experience that lets professionals share their complete information with a single tap.
                </p>
                <MotionLink href={ROUTES.HOW_TO_USE}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="tv-btn tv-btn-secondary"
                  >
                    Learn How It Works
                    <ArrowUpRight className="w-5 h-5" />
                  </MotionLink>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative h-80 rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 rounded-2xl border border-[#C9A961]/25 bg-[#232E2A]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-20 h-20 text-[#C9A961]" strokeWidth={1.2} aria-hidden="true" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Core Values */}
        <section className="tv-surface-graphite tv-section">
          <div className="site-container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="tv-h2 mb-5">Our Core Values</h2>
              <p className="tv-lead max-w-2xl mx-auto">
                These principles guide every decision we make and every feature we build
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.2, duration: 0.8 }}
                    whileHover={{ y: -6 }}
                    className="tv-panel tv-panel-pad"
                  >
                    <div className={`w-16 h-16 rounded-xl ${value.color} mb-6 flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="tv-h4 mb-3">{value.title}</h3>
                    <p className="tv-small">{value.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="tv-surface-bone tv-section">
          <div className="site-container">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="grid md:grid-cols-4 gap-8"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.15, duration: 0.6 }}
                  className="tv-panel tv-panel-pad text-center"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
                    className="text-4xl md:text-5xl font-semibold text-[#F1F3F1]" style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
                  >
                    {stat.number}
                  </motion.div>
                  <p className="tv-small mt-1">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="tv-surface-graphite tv-section">
          <div className="site-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative border-t border-[#C9A961]/25 pt-12 md:pt-16"
            >
              
              <div className="relative z-10 text-center">
                <h2 className="tv-h2 mb-5">Join Our Community</h2>
                <p className="tv-lead mb-9 max-w-2xl mx-auto">
                  Be part of the revolution. Create your modern digital business card today.
                </p>
                <MotionLink href={ROUTES.ORDER}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="tv-btn tv-btn-lg tv-btn-primary"
                  >
                    Create Your Card
                    <ArrowUpRight className="w-5 h-5" />
                  </MotionLink>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
