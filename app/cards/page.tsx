'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import CardPreviewModal from '@/components/CardPreviewModal';
import NFCCard from '@/components/ui/NFCCard';
import ContactModal, { ContactSource } from '@/components/ContactModal';
import AuthModal from '@/components/AuthModal';
import OtherCardsSolutionsSection from '@/sections/OtherCardsSolutionsSection';
import { motion } from 'framer-motion';
import {
  Eye,
  ArrowUpRight,
  Globe,
  Zap,
  Users,
  CreditCard,
  Infinity as InfinityIcon,
  MessageSquare,
} from 'lucide-react';
import { useCardDesigns, CardDesign } from '@/hooks/useCardDesigns';

const includedFeatures = [
  { icon: InfinityIcon, title: 'Free hosting forever', desc: 'Your profile stays live without extra cost.' },
  { icon: MessageSquare, title: 'Contact form included', desc: 'Built-in messaging to connect with leads.' },
  { icon: Zap, title: 'Mobile responsive', desc: 'Reads correctly on any device or screen size.' },
  { icon: Users, title: 'Unlimited viewers', desc: 'Track unlimited profile views and interactions.' },
  { icon: CreditCard, title: 'No renewal fees', desc: 'One-time purchase, lifetime access.' },
  { icon: Globe, title: 'Global reach', desc: 'Share your profile worldwide instantly.' },
];

export default function CardsPage() {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<CardDesign | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Use dynamic card designs
  const { cardDesigns, loading } = useCardDesigns();

  // Contact Modal State (lifted up for reuse)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactModalSource, setContactModalSource] = useState<ContactSource>('general');

  const openContactModal = (source: ContactSource) => {
    setContactModalSource(source);
    setIsContactModalOpen(true);
  };

  const closeContactModal = () => {
    setIsContactModalOpen(false);
  };

  const handlePreview = (card: CardDesign) => {
    setSelectedCard(card);
    setIsPreviewOpen(true);
  };

  const handleBuyNow = (card: CardDesign) => {
    if (card.type === 'custom') {
      openContactModal('custom');
      return;
    }

    // Route to card creation with selected template
    router.push(`/create-card?template=${card.slug}`);
  };

  /**
   * Card reveal.
   *
   * This deliberately does NOT use parent-orchestrated variants
   * (container `initial="hidden" animate="visible"` + `staggerChildren`).
   * useCardDesigns seeds with fallback designs and then swaps in the fetched
   * products, so the grid's children remount after the parent's animation has
   * already finished - they mounted in the "hidden" state and never received
   * the "visible" propagation, leaving every card stuck at opacity 0.
   *
   * Each card now animates itself on mount, with the stagger expressed as a
   * per-index delay, so a list that changes identity still reveals correctly.
   */
  const cardReveal = (index: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: Math.min(index, 8) * 0.06 },
  });

  return (
    <div className="frontend-dark">
      <Navbar />
      <main>
        {/* HERO — left-aligned on ink, no centred badge pill. */}
        <section className="tv-hero pt-32 pb-14 md:pt-44 md:pb-20">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-7"
              >
                <p className="tv-eyebrow mb-7">The cards</p>
                <h1 className="tv-display" style={{ maxWidth: '14ch' }}>
                  Pick the one you want to hand over.
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="lg:col-span-5 lg:pb-3"
              >
                <p className="tv-lead">
                  Every card carries the same chip and the same profile. Only the
                  finish changes.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CATALOGUE — on paper. The products are the content of this page, so
            they get the light surface and the dark sections frame them. */}
        <section className="tv-surface-bone tv-section">
          <div className="site-container">
            {/* The hook seeds itself with fallback designs, so there is always
                something to render on the server - the skeleton below only ever
                shows if that ever stops being true. */}
            {loading ? (
              <div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
                aria-busy="true"
                aria-label="Loading card designs"
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-96 rounded-[14px] border border-[#12100C]/12 bg-[#E8E3D8] animate-pulse motion-reduce:animate-none"
                  />
                ))}
              </div>
            ) : cardDesigns.length === 0 ? (
              <div className="tv-panel tv-panel-pad py-20 text-center">
                <p className="tv-h3 mb-2">No card designs available right now.</p>
                <p className="tv-body mb-7 mx-auto" style={{ maxWidth: '46ch' }}>
                  Our catalogue is being updated. Get in touch and we will walk you
                  through the current options.
                </p>
                <button
                  onClick={() => openContactModal('general')}
                  className="tv-btn tv-btn-secondary"
                >
                  Talk to our team
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {cardDesigns.map((card, index) => (
                  <motion.article
                    key={card.id}
                    {...cardReveal(index)}
                    className="group tv-panel flex flex-col h-full overflow-hidden"
                  >
                    {/* Card Preview */}
                    <div className="relative aspect-[1.6/1] overflow-hidden bg-[#E8E3D8]">
                      {/* A photograph if the design has one; otherwise the
                          finish is drawn. Every design carries a gradient, so
                          nothing needs to fall back to a grey placeholder. */}
                      {card.images?.[0] ? (
                        <img
                          src={card.images[0]}
                          alt={`${card.name} NFC card`}
                          width={480}
                          height={300}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <NFCCard
                          name={card.name}
                          color={card.color}
                          label={card.material || undefined}
                        />
                      )}

                      {/* Quick view. Revealed on focus-within as well as hover,
                          so the button is reachable from the keyboard. */}
                      <div className="absolute inset-0 flex items-center justify-center bg-[#12100C]/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                        <button
                          onClick={() => handlePreview(card)}
                          className="tv-btn tv-btn-secondary !text-[#F1F3F1] !border-[#F1F3F1]/45 !bg-[#12100C]/60"
                        >
                          <Eye className="w-4 h-4" aria-hidden="true" />
                          Quick view
                          <span className="sr-only"> of {card.name}</span>
                        </button>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="flex flex-col grow tv-panel-pad">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h2 className="tv-h4">{card.name}</h2>
                        <span className="tv-mono shrink-0 pt-1">
                          {card.type === 'custom'
                            ? 'Custom'
                            : card.type === 'premium'
                            ? 'Premium'
                            : 'Basic'}
                        </span>
                      </div>

                      {/* Price */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-2.5">
                          <p
                            className="text-2xl font-semibold text-[#12100C]"
                            style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
                          >
                            {card.price}
                          </p>
                          {card.salePrice && card.salePriceValue && card.salePriceValue < card.priceValue && (
                            <p
                              className="text-sm line-through text-[#4C534F]"
                              style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
                            >
                              {card.salePrice}
                            </p>
                          )}
                        </div>
                        {/* This line renders once per card, so the lifetime-website
                            claim is deliberately not repeated here - it is made
                            once, in the section below the grid. */}
                        <p className="tv-small mt-1">
                          {card.type === 'custom'
                            ? 'Base NFC card price'
                            : 'Includes your digital profile'}
                        </p>
                      </div>

                      {/* Spec */}
                      <div className="min-h-[76px] mb-6">
                        {card.type === 'custom' ? (
                          <div className="tv-spec">
                            <p className="tv-spec-row">Free if you provide your own design</p>
                            <p className="tv-spec-row">
                              Design service available at additional cost
                            </p>
                          </div>
                        ) : (
                          <div className="tv-spec">
                            <p className="tv-spec-row">
                              Contact form included in your digital profile
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action. Custom designs open the enquiry modal, so they
                          take the contact label rather than the buy label. */}
                      <div className="mt-auto">
                        <button
                          onClick={() => handleBuyNow(card)}
                          className={`tv-btn w-full ${
                            card.type === 'custom' ? 'tv-btn-secondary' : 'tv-btn-gilded'
                          }`}
                        >
                          {card.type === 'custom' ? (
                            <span>Talk to our team</span>
                          ) : (
                            <>
                              <span>Get your card</span>
                              <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Other NFC Card Solutions Section */}
      <OtherCardsSolutionsSection onContactClick={openContactModal} />

      {/* WHAT'S INCLUDED — the old version ran a 6-card grid, a separate
          3-item benefit list and a trust line that all said the same thing.
          Condensed to one spec grid, and the standalone "Need Help Choosing?"
          section is folded into the close below. */}
      <section className="tv-surface-ink tv-section">
        <div className="site-container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mb-12 md:mb-16"
          >
            <p className="tv-eyebrow mb-6">Included with every card</p>
            <h2 className="tv-h2 mb-4">
              A{' '}
              <a
                href="/preview-website"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-[#C9A961]/50 underline-offset-[6px] hover:decoration-[#C9A961]"
              >
                free lifetime website
              </a>
              , not just a card.
            </h2>
            <p className="tv-lead tv-measure-body">
              No subscriptions. No hidden costs. Built to scale with you.
            </p>
          </motion.div>

          <motion.dl
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
          >
            {includedFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="tv-panel tv-panel-pad">
                  <Icon
                    className="w-5 h-5 mb-5 text-[#C9A961]"
                    strokeWidth={1.6}
                    aria-hidden="true"
                  />
                  <dt className="tv-h4 mb-2">{feature.title}</dt>
                  <dd className="tv-small">{feature.desc}</dd>
                </div>
              );
            })}
          </motion.dl>

          {/* CLOSE — absorbs the former "Need Help Choosing?" section. */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14 md:mt-16 pt-12 md:pt-14 border-t border-[#C9A961]/25 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end"
          >
            <div className="lg:col-span-7">
              <h3 className="tv-h3 mb-3">Not sure which one?</h3>
              <p className="tv-body tv-measure-body">
                Our team will help you pick the right card for your brand.
              </p>
              <p className="tv-mono mt-5">Trusted by 10,000+ professionals worldwide</p>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row lg:justify-end items-start sm:items-center gap-x-6 gap-y-4">
              <a
                href="/preview-website"
                target="_blank"
                rel="noopener noreferrer"
                className="tv-btn tv-btn-lg tv-btn-secondary tv-btn-block"
              >
                See example profile
              </a>
              <button onClick={() => openContactModal('general')} className="tv-btn-tertiary">
                Talk to our team
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />

      {/* Preview Modal */}
      <CardPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        card={selectedCard}
      />

      {/* Contact Modal (Single instance for all contact buttons) */}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={closeContactModal}
        source={contactModalSource}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        mode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
