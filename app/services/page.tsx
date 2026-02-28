'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import ContactModal, { ContactSource } from '@/components/ContactModal';
import TechStackSection from '@/sections/TechStackSection';
import {
  GraduationCap,
  Briefcase,
  Building2,
  Globe,
  Smartphone,
  Megaphone,
  Palette,
  Check,
  ArrowRight,
  Sparkles,
  MessageSquare,
  Code,
  Settings,
  Video,
} from 'lucide-react';

// NFC Solutions data
const nfcSolutions = [
  {
    id: 'school' as ContactSource,
    icon: GraduationCap,
    title: 'School ID Cards',
    description: 'Smart NFC ID cards for educational institutions with student information webpages.',
    features: [
      'Minimum order: 25 cards',
      'Fully customized card design',
      'Student information webpage',
      '3 free website updates',
    ],
    gradient: 'from-blue-600 to-indigo-600',
    bgGradient: 'bg-gradient-to-br from-blue-50 to-indigo-50',
  },
  {
    id: 'business' as ContactSource,
    icon: Briefcase,
    title: 'Business Cards (Bulk)',
    description: 'Professional NFC business cards for teams with digital profiles.',
    features: [
      'Minimum order: 25 cards',
      'Custom designed NFC cards',
      'Digital profile with contact form',
      '3 free website updates',
    ],
    gradient: 'from-gray-700 to-gray-900',
    bgGradient: 'bg-gradient-to-br from-gray-50 to-slate-100',
  },
  {
    id: 'corporate' as ContactSource,
    icon: Building2,
    title: 'Corporate ID Cards',
    description: 'Enterprise-grade employee ID cards with NFC technology.',
    features: [
      'Minimum order: 25 cards',
      'Custom company branding',
      'Employee information webpage',
      '3 free website updates',
    ],
    gradient: 'from-teal-600 to-emerald-600',
    bgGradient: 'bg-gradient-to-br from-teal-50 to-emerald-50',
  },
];

// Digital Solutions data - Modern 2026 design
const digitalSolutions = [
  {
    id: 'website',
    icon: Globe,
    title: 'Website Development',
    description: 'Professional websites built for performance and conversion.',
    features: [
      'Business websites',
      'E-commerce websites',
      'Portfolio websites',
      'Custom web applications',
      'SEO optimized structure',
      'No-Code Website Development',
    ],
    cta: 'Request Quote',
    accentColor: 'from-violet-500 to-purple-600',
    glowColor: 'from-violet-200/50 to-purple-200/40',
  },
  {
    id: 'mobile',
    icon: Smartphone,
    title: 'Mobile App Development',
    description: 'Native and cross-platform mobile applications for your business.',
    features: [
      'Android App Development',
      'iOS App Development',
      'Cross-platform apps',
      'Business management apps',
      'Custom enterprise apps',
    ],
    cta: 'Start Your Project',
    accentColor: 'from-pink-500 to-rose-600',
    glowColor: 'from-pink-200/50 to-rose-200/40',
  },
  {
    id: 'marketing',
    icon: Megaphone,
    title: 'Digital Marketing',
    description: 'Data-driven marketing strategies to grow your online presence.',
    features: [
      'Social Media Marketing',
      'Paid Ads (Google & Meta)',
      'SEO Optimization',
      'WhatsApp Marketing',
      'Email Marketing Campaigns',
      'Lead Generation',
      'Performance Marketing',
    ],
    cta: 'Grow With Us',
    accentColor: 'from-orange-500 to-amber-500',
    glowColor: 'from-orange-200/50 to-amber-200/40',
  },
  {
    id: 'reels',
    icon: Video,
    title: 'Reels & Short Video Editing',
    description: 'High-impact short-form videos optimized for Instagram, YouTube Shorts, and Facebook.',
    features: [
      'Instagram Reels Editing',
      'YouTube Shorts Editing',
      'Motion Graphics & Effects',
      'Color Grading',
      'Subtitle & Caption Design',
      'Trend-based Editing Styles',
    ],
    cta: 'Create Viral Content',
    accentColor: 'from-pink-600 to-purple-600',
    glowColor: 'from-pink-200/40 to-purple-200/30',
  },
  {
    id: 'branding',
    icon: Palette,
    title: 'Branding & Identity',
    description: 'Create a memorable brand identity that resonates with your audience.',
    features: [
      'Logo Design',
      'Brand Identity Design',
      'Packaging Design',
      'Corporate Branding',
      'Rebranding Solutions',
    ],
    cta: 'Build Your Brand',
    accentColor: 'from-cyan-500 to-teal-600',
    glowColor: 'from-cyan-200/50 to-teal-200/40',
  },
  {
    id: 'software',
    icon: Code,
    title: 'Custom Software Development',
    description: 'Tailored software solutions to streamline your business operations.',
    features: [
      'CRM Systems',
      'ERP Solutions',
      'SaaS Platforms',
      'Internal Business Tools',
      'Automation Systems',
    ],
    cta: 'Discuss Your Project',
    accentColor: 'from-emerald-500 to-green-600',
    glowColor: 'from-emerald-200/50 to-green-200/40',
  },
];

export default function ServicesPage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactModalSource, setContactModalSource] = useState<ContactSource>('general');

  const openContactModal = (source: ContactSource) => {
    setContactModalSource(source);
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <>
      <Navbar />

      {/* Hero Banner - Premium Compact Design */}
      <section className="relative w-full pt-32 pb-16 md:pt-40 md:pb-20 lg:pt-44 lg:pb-24 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-10 w-72 h-72 bg-teal-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl" />
        </div>
        
        <div className="site-container">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                staggerChildren: 0.12,
                delayChildren: 0.2,
              }}
              className="w-full text-center space-y-6 md:space-y-8"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1] }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full hover:border-gray-300 transition-colors duration-300">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    What We Offer
                  </span>
                </div>
              </motion.div>

              {/* Headline - Single Line */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1], delay: 0.1 }}
              >
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-tight text-gray-900 tracking-tight">
                  Our{' '}
                  <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                    Services
                  </span>
                </h1>
              </motion.div>

              {/* Subtext */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1], delay: 0.2 }}
                className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto px-4"
              >
                Comprehensive digital solutions to grow your brand and connect with your audience.
              </motion.p>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1], delay: 0.3 }}
                className="flex justify-center pt-4"
              >
                <motion.button
                  whileHover={{ y: -3 }}
                  whileTap={{ y: 1 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                  className="group inline-flex items-center justify-center gap-2 px-8 py-3 md:px-10 md:py-4 rounded-xl font-bold text-white text-base md:text-lg bg-gradient-to-r from-teal-600 to-emerald-500 shadow-md transition-shadow duration-220"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
      </section>

      <main className="min-h-screen bg-white">
        <div className="site-container py-16 md:py-20 lg:py-24">

          {/* Section 1: NFC Card Solutions */}
          <section className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
                NFC Card Solutions
              </h2>
              <p className="text-[#4b635d] max-w-2xl mx-auto">
                Bulk and enterprise NFC solutions for institutions and businesses.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {nfcSolutions.map((solution) => (
                <motion.div
                  key={solution.id}
                  variants={itemVariants}
                  className="group flex flex-col h-full bg-white rounded-3xl shadow-lg border border-teal-100 overflow-hidden hover:-translate-y-2 transition-all duration-300 hover:shadow-xl"
                >
                  {/* Card Header */}
                  <div className={`${solution.bgGradient} p-6`}>
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${solution.gradient} flex items-center justify-center shadow-lg mb-4`}
                    >
                      <solution.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-[#0f2e25] font-space-grotesk mb-2">
                      {solution.title}
                    </h3>
                    <p className="text-sm text-[#4b635d]">{solution.description}</p>
                  </div>

                  {/* Card Content */}
                  <div className="flex flex-col flex-grow p-6">
                    <ul className="space-y-3 mb-6 flex-grow">
                      {solution.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-[#4b635d]">
                          <Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto">
                      <button
                        onClick={() => openContactModal(solution.id)}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0f2e25] hover:bg-[#1a4a3d] text-white font-medium rounded-full transition-all duration-300"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Contact Us</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Section 2: Digital Solutions - Modern Bento Grid */}
          <section className="relative">
            {/* Background Gradient Blob */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-br from-teal-100/40 to-emerald-100/30 rounded-full blur-3xl opacity-60 pointer-events-none" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16 relative z-10"
            >
              <h2 className="text-4xl md:text-5xl font-bold text-[#0f2e25] font-space-grotesk tracking-tight mb-4">
                Digital Solutions for{' '}
                <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                  Modern Businesses
                </span>
              </h2>
              <p className="text-lg text-[#4b635d] max-w-2xl mx-auto">
                End-to-end technology services built for growth.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10 items-stretch"
            >
              {digitalSolutions.map((service, index) => (
                <motion.div
                  key={service.id}
                  variants={itemVariants}
                  className={`group relative ${
                    index === digitalSolutions.length - 1 && digitalSolutions.length % 2 !== 0
                      ? 'md:col-span-2 md:max-w-2xl md:mx-auto'
                      : ''
                  }`}
                >
                  {/* Gradient Glow Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${service.glowColor} rounded-3xl blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 -z-10`}
                  />
                  
                  {/* Card */}
                  <div className="relative flex flex-col h-full backdrop-blur-md bg-white/70 rounded-3xl shadow-xl p-10 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl">
                    {/* Top Content */}
                    <div className="flex flex-col">
                      {/* Icon */}
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.accentColor} flex items-center justify-center shadow-lg mb-6`}
                      >
                        <service.icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-2xl font-bold text-[#0f2e25] font-space-grotesk mb-3">
                        {service.title}
                      </h3>
                      <p className="text-[#4b635d] mb-6">
                        {service.description}
                      </p>
                    </div>

                    {/* Features List */}
                    <ul
                      className="flex-grow space-y-3"
                    >
                      {service.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-3 text-[#4b635d]"
                        >
                          <div
                            className={`rounded-full bg-gradient-to-br ${service.accentColor} flex items-center justify-center flex-shrink-0 w-5 h-5`}
                          >
                            <Check
                              className="w-3 h-3 text-white"
                            />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <div className="mt-8">
                      <button
                        onClick={() => openContactModal('general')}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 text-white font-medium rounded-full hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-300 group/btn"
                      >
                        <span>{service.cta}</span>
                        <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-300" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </section>
        </div>
      </main>

      {/* Tech Stack Section */}
      <TechStackSection />

      {/* Modern CTA Section */}
      <section className="relative overflow-hidden py-32 bg-gradient-to-br from-[#0f2e25] via-[#134e40] to-[#0a2a22]">
        {/* Animated Gradient Blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl animate-pulse opacity-40" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-emerald-400/15 rounded-full blur-3xl animate-pulse opacity-30" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-teal-300/10 rounded-full blur-3xl animate-pulse opacity-25" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative z-10 site-container text-center"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-space-grotesk mb-6 leading-tight">
            Let&apos;s Build Something{' '}
            <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">
              Powerful
            </span>{' '}
            Together.
          </h2>
          <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
            From NFC cards to full-scale digital solutions — we help brands grow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => openContactModal('general')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-900 font-semibold rounded-full hover:-translate-y-1 transition-all duration-220 shadow-lg hover:shadow-xl"
            >
              <span>Talk to Our Team</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="/services"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/40 text-white font-semibold rounded-full hover:bg-white/10 transition-all duration-300"
            >
              <span>View Our Services</span>
            </a>
          </div>
        </motion.div>
      </section>

      <Footer />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={closeContactModal}
        source={contactModalSource}
      />
    </>
  );
}
