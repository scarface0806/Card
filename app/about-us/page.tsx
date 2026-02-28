'use client';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Zap, Target, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';
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
      color: 'bg-teal-600',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'Building a global network of professionals sharing seamlessly',
      color: 'bg-emerald-600',
    },
    {
      icon: Target,
      title: 'Simplicity',
      description: 'Complex technology made simple for everyone',
      color: 'bg-cyan-600',
    },
  ];

  const stats = [
    { number: '10K+', label: 'Active Users' },
    { number: '50K+', label: 'Cards Created' },
    { number: '95%', label: 'Satisfaction Rate' },
    { number: '24/7', label: 'Support' },
  ];

  return (
    <>
      <Navbar />
      <main className="bg-gradient-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff] min-h-screen">
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto max-w-7xl px-4 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center"
            >
              <motion.div variants={itemVariants} className="mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full text-sm font-semibold text-teal-700">
                  <Award className="w-4 h-4" />
                  About Our Mission
                </span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold mb-6 text-[#0f2e25] font-space-grotesk">
                Revolutionizing{' '}
                <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  Connection
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-xl md:text-2xl text-[#4b635d] mb-8 max-w-3xl mx-auto leading-relaxed">
                We're building the future of professional connections through intelligent NFC technology. One tap, endless possibilities.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20 md:py-32 bg-white">
          <div className="container mx-auto max-w-7xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid md:grid-cols-2 gap-12 items-center"
            >
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#0f2e25] font-space-grotesk">Our Story</h2>
                <p className="text-lg text-[#4b635d] mb-4">
                  Tapvyo was born from a simple observation: connecting professionals should be effortless. We realized that traditional business cards are outdated, and digital alternatives were too complicated.
                </p>
                <p className="text-lg text-[#4b635d] mb-6">
                  Our team of engineers and designers worked tirelessly to create the perfect blend of technology and elegance. The result? A seamless experience that lets professionals share their complete information with a single tap.
                </p>
                <Link href={ROUTES.HOW_TO_USE}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl font-semibold hover:bg-teal-100 transition-all duration-300"
                  >
                    Learn How It Works
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              </div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative h-96 rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-2xl border border-teal-200" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Zap className="w-32 h-32 text-teal-300" />
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto max-w-7xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#0f2e25] font-space-grotesk">Our Core Values</h2>
              <p className="text-lg text-[#4b635d] max-w-2xl mx-auto">
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
                    className="group relative p-8 rounded-2xl border border-teal-100 bg-white shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <div className={`w-16 h-16 rounded-xl ${value.color} mb-6 flex items-center justify-center`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-[#0f2e25] font-space-grotesk">{value.title}</h3>
                    <p className="text-[#4b635d]">{value.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-20 md:py-32 bg-white">
          <div className="container mx-auto max-w-7xl px-4 lg:px-8">
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
                  className="text-center p-8 rounded-2xl bg-teal-50/50 border border-teal-100"
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ delay: index * 0.15 + 0.3, duration: 0.6 }}
                    className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent mb-2"
                  >
                    {stat.number}
                  </motion.div>
                  <p className="text-[#4b635d] text-lg">{stat.label}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto max-w-7xl px-4 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative p-12 md:p-20 rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50 to-emerald-50 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl -z-10" />
              <div className="relative z-10 text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-[#0f2e25] font-space-grotesk">Join Our Community</h2>
                <p className="text-lg text-[#4b635d] mb-8 max-w-2xl mx-auto">
                  Be part of the revolution. Create your modern digital business card today.
                </p>
                <Link href={ROUTES.ORDER}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-semibold transition-all duration-300"
                  >
                    Create Your Card
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
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
