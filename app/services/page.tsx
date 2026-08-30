'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import ContactModal, { ContactSource } from '@/components/ContactModal';
import TechStackSection from '@/sections/TechStackSection';
import { ROUTES } from '@/utils/constants';
import {
  GraduationCap,
  Briefcase,
  Building2,
  Globe,
  Smartphone,
  Megaphone,
  Palette,
  ArrowUpRight,
  Code,
  Video,
} from 'lucide-react';

/**
 * The per-item `gradient` / `bgGradient` / `accentColor` / `glowColor` fields
 * are gone. Between them the two lists carried nine unrelated ramps - violet,
 * pink, orange, cyan, two greys and three greens - which read as a stock icon
 * set rather than one brand. Every card now sits on the same panel with a
 * brass icon, and the lists are told apart by their section, not by hue.
 *
 * The per-item `cta` strings are gone too: all six digital services fired the
 * same openContactModal('general') call behind six different labels
 * ("Request Quote", "Grow With Us", "Create Viral Content", ...).
 */
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
  },
];

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

  // Per-item mount animation rather than parent-orchestrated variants, so a
  // card cannot get stranded at opacity 0 if its list ever re-renders.
  const reveal = (index: number) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: { duration: 0.5, delay: Math.min(index, 6) * 0.06 },
  });

  return (
    <div className="frontend-dark">
      <Navbar />

      {/* HERO — left-aligned on ink. */}
      <section className="tv-hero pt-32 pb-14 md:pt-44 md:pb-20">
        <div className="site-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1] }}
              className="lg:col-span-7"
            >
              <p className="tv-eyebrow mb-7">What we offer</p>
              <h1 className="tv-display" style={{ maxWidth: '15ch' }}>
                Cards, and everything around them.
              </h1>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.320, 1], delay: 0.15 }}
              className="lg:col-span-5 lg:pb-3"
            >
              <p className="tv-lead mb-7">
                Comprehensive digital solutions to grow your brand and connect with
                your audience.
              </p>

              {/* NOTE: this button has never had an onClick or an href - it is
                  inert, and was inert before this redesign. Adding a handler
                  would be a behaviour change, so it is left exactly as it was
                  and reported instead. */}
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                className="tv-btn tv-btn-lg tv-btn-primary"
              >
                Get started
                <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      <main>
        {/* NFC CARD SOLUTIONS — spec panels on graphite. */}
        <section className="tv-surface-graphite tv-section">
          <div className="site-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mb-12 md:mb-16"
            >
              <p className="tv-eyebrow mb-6">NFC cards</p>
              <h2 className="tv-h2 mb-4">Cards in bulk, for institutions and teams.</h2>
              <p className="tv-lead tv-measure-body">
                Every programme is custom designed, and every card carries its own
                webpage.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {nfcSolutions.map((solution, index) => {
                const Icon = solution.icon;
                return (
                  <motion.article
                    key={solution.id}
                    {...reveal(index)}
                    className="tv-panel tv-panel-pad flex flex-col h-full"
                  >
                    <Icon
                      className="w-5 h-5 mb-5 text-[#C9A961]"
                      strokeWidth={1.6}
                      aria-hidden="true"
                    />
                    <h3 className="tv-h4 mb-2">{solution.title}</h3>
                    <p className="tv-small mb-6">{solution.description}</p>

                    <ul className="tv-spec grow mb-7">
                      {solution.features.map((feature) => (
                        <li key={feature} className="tv-spec-row">
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => openContactModal(solution.id)}
                      className="tv-btn tv-btn-secondary w-full mt-auto"
                    >
                      Talk to our team
                    </button>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* DIGITAL SOLUTIONS — the page's light section. */}
        <section className="tv-surface-bone tv-section">
          <div className="site-container">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mb-12 md:mb-16"
            >
              <p className="tv-eyebrow mb-6">Digital work</p>
              <h2 className="tv-h2 mb-4">The rest of what we build.</h2>
              <p className="tv-lead tv-measure-body">
                End-to-end technology services built for growth.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 items-stretch">
              {digitalSolutions.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.article
                    key={service.id}
                    {...reveal(index)}
                    className="tv-panel tv-panel-pad flex flex-col h-full"
                  >
                    <Icon
                      className="w-5 h-5 mb-5 text-[#6E5518]"
                      strokeWidth={1.6}
                      aria-hidden="true"
                    />
                    <h3 className="tv-h3 mb-2">{service.title}</h3>
                    <p className="tv-body mb-6">{service.description}</p>

                    <ul className="tv-spec grow mb-7">
                      {service.features.map((feature) => (
                        <li key={feature} className="tv-spec-row">
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => openContactModal('general')}
                      className="tv-btn tv-btn-secondary w-full mt-auto"
                    >
                      Talk to our team
                    </button>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Tech Stack Section */}
      <TechStackSection />

      {/* CLOSE */}
      <section className="tv-surface-ink tv-section">
        <div className="site-container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end border-t border-[#C9A961]/25 pt-12 md:pt-16"
          >
            <div className="lg:col-span-7">
              <h2 className="tv-h2 mb-4">Let&apos;s build something together.</h2>
              <p className="tv-body tv-measure-body">
                From NFC cards to full-scale digital solutions — we help brands grow
                faster and smarter.
              </p>
              <p className="tv-mono mt-5">Trusted by 10,000+ professionals worldwide</p>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:justify-end gap-3">
              {/* On this page the enquiry is the terminal action, so it takes
                  the primary tier and the reserved arrow. */}
              <motion.button
                onClick={() => openContactModal('general')}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block"
              >
                Talk to our team
                <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
              </motion.button>

              <motion.a
                href={ROUTES.CARDS}
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                className="tv-btn tv-btn-lg tv-btn-secondary tv-btn-block"
              >
                View our cards
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Contact Modal */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={closeContactModal}
        source={contactModalSource}
      />
    </div>
  );
}
