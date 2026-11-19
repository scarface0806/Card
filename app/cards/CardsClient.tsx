'use client';

import { Suspense, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import CatalogueTile from '@/components/cards/CatalogueTile';
import type { ContactSource } from '@/components/ContactModal';
import OtherCardsSolutionsSection from '@/sections/OtherCardsSolutionsSection';
import { motion } from 'framer-motion';
import {
  Globe,
  Zap,
  Users,
  CreditCard,
  Infinity as InfinityIcon,
  MessageSquare,
} from 'lucide-react';
import { useCardDesigns, CardDesign } from '@/hooks/useCardDesigns';
import SelectionNotice from './SelectionNotice';
import ProductAssurances from '@/components/trust/ProductAssurances';
import CustomDesignSection from '@/components/cards/CustomDesignSection';
import { normalizeOrientation } from '@/lib/products/orientation';

/**
 * The three modals are code-split and mounted only while open.
 *
 * They were static imports rendered unconditionally with `isOpen={false}`, so
 * every visitor to /cards downloaded, parsed and hydrated all three - a card
 * preview, a contact form and a full auth form - before seeing a single card,
 * for UI most of them never open. That is the bulk of Lighthouse's "unused
 * JavaScript" on this route.
 *
 * ssr:false because none of them render anything until opened by a click, so
 * there is nothing for the server to usefully produce. This mirrors the
 * pattern app/(frontend)/HomeClient.tsx already uses for ContactModal.
 */
const CardPreviewModal = dynamic(() => import('@/components/CardPreviewModal'), { ssr: false });
const ContactModal = dynamic(() => import('@/components/ContactModal'), { ssr: false });
const AuthModal = dynamic(() => import('@/components/AuthModal'), { ssr: false });

const includedFeatures = [
  { icon: InfinityIcon, title: 'Free hosting forever', desc: 'Your profile stays live without extra cost.' },
  { icon: MessageSquare, title: 'Contact form included', desc: 'Built-in messaging to connect with leads.' },
  { icon: Zap, title: 'Mobile responsive', desc: 'Reads correctly on any device or screen size.' },
  { icon: Users, title: 'Unlimited viewers', desc: 'Track unlimited profile views and interactions.' },
  { icon: CreditCard, title: 'No renewal fees', desc: 'One-time purchase, lifetime access.' },
  { icon: Globe, title: 'Global reach', desc: 'Share your profile worldwide instantly.' },
];

interface CardsClientProps {
  /**
   * The catalogue, already loaded and cached on the server by app/cards/page.tsx.
   * Passing it in is what puts the cards in the prerendered HTML instead of
   * behind a hydrate-then-fetch round trip, so the grid is on screen before any
   * of this file's JavaScript has run.
   */
  initialDesigns: CardDesign[];
}

export default function CardsClient({ initialDesigns }: CardsClientProps) {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<CardDesign | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Seeded from the server: `loading` is already false on the first render.
  const { cardDesigns, loading } = useCardDesigns(initialDesigns);

  // Customised Card products are bought differently (own artwork + design
  // charge), so they get their own section below the grid.
  const regularDesigns = cardDesigns.filter((design) => !design.isCustomDesign);
  const customDesigns = cardDesigns.filter((design) => design.isCustomDesign);

  // One section per card shape - see the SPLIT BY ORIENTATION note in the JSX.
  // filter() keeps the database order inside each group.
  const horizontalDesigns = regularDesigns.filter(
    (design) => normalizeOrientation(design.orientation) === 'horizontal'
  );
  const verticalDesigns = regularDesigns.filter(
    (design) => normalizeOrientation(design.orientation) === 'vertical'
  );

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
    // A Customised Card always goes to checkout, even if someone also gave it
    // the enquiry-only "custom" card type.
    if (card.type === 'custom' && !card.isCustomDesign) {
      openContactModal('custom');
      return;
    }

    // The product ID, not the slug.
    //
    // This used to push `?template=${card.slug}`, which /create-card resolved
    // against a hardcoded array of card tiers. A database slug is never in that
    // array, so every admin-created product fell through to the default and was
    // presented - and charged - at 599 regardless of its real price. The
    // checkout page now loads this exact product row.
    router.push(`/create-card?productId=${encodeURIComponent(card.id)}`);
  };


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
            {/* Only this subtree reads searchParams, so the rest of the page
                still prerenders statically. */}
            <Suspense fallback={null}>
              <SelectionNotice />
            </Suspense>

            {/* Delivery, QR backup and replacement guarantee, stated once for
                the whole catalogue rather than repeated on every tile. Values
                come from site-config.ts. */}
            <ProductAssurances className="mb-8 md:mb-10 md:flex md:flex-wrap md:gap-x-8 md:space-y-0" />

            {/* Products are fetched client-side, so the skeleton is real: there
                is nothing to show until they arrive. The hook no longer seeds
                itself with invented cards, so an empty result renders the empty
                state below rather than six products that do not exist. */}
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
              <>
                {/* SPLIT BY ORIENTATION. All products used to share one
                    1/2/3-column grid. A portrait tile (1:1.6) is much taller
                    than a landscape one, so a row mixing the two stretched the
                    landscape tiles to match, leaving a large empty gap above
                    their buttons. Each shape now gets its own section and its
                    own grid, so every row holds tiles of one height. Database
                    order is kept within each group. */}
                {horizontalDesigns.length > 0 && (
                  <section aria-labelledby="cards-horizontal-heading">
                    <div className="max-w-2xl mb-8 md:mb-10">
                      <p className="tv-eyebrow mb-5">Landscape</p>
                      <h2 id="cards-horizontal-heading" className="tv-h2 mb-3">Horizontal Cards</h2>
                      <p className="tv-body">The classic landscape card.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                      {horizontalDesigns.map((card, index) => (
                        <CatalogueTile
                          key={card.id}
                          card={card}
                          index={index}
                          onPreview={handlePreview}
                          onBuy={handleBuyNow}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {verticalDesigns.length > 0 && (
                  <section
                    aria-labelledby="cards-vertical-heading"
                    className={horizontalDesigns.length > 0 ? 'mt-16 md:mt-24 pt-12 md:pt-16 border-t border-[#12100C]/12' : ''}
                  >
                    <div className="max-w-2xl mb-8 md:mb-10">
                      <p className="tv-eyebrow mb-5">Portrait</p>
                      <h2 id="cards-vertical-heading" className="tv-h2 mb-3">Vertical Cards</h2>
                      <p className="tv-body">The same card, stood on its end.</p>
                    </div>
                    {/* Portrait tiles are narrower, so more columns on wide
                        screens. On a phone a single full-width portrait card
                        would be ~550px tall, so it is capped and centred. */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6 max-w-[360px] mx-auto sm:max-w-none">
                      {verticalDesigns.map((card, index) => (
                        <CatalogueTile
                          key={card.id}
                          card={card}
                          index={index}
                          onPreview={handlePreview}
                          onBuy={handleBuyNow}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {!loading && <CustomDesignSection designs={customDesigns} onSelect={handleBuyNow} />}
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
              No subscriptions. No renewal fees. Built to scale with you.
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

      {/* Each modal is mounted only while open. The `isOpen` prop is kept as
          well, so each keeps its own open/close transition - the guard decides
          whether the component exists at all, the prop decides how it animates. */}
      {isPreviewOpen ? (
        <CardPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          card={selectedCard}
        />
      ) : null}

      {/* Contact Modal (Single instance for all contact buttons) */}
      {isContactModalOpen ? (
        <ContactModal
          isOpen={isContactModalOpen}
          onClose={closeContactModal}
          source={contactModalSource}
        />
      ) : null}

      {/* Auth Modal */}
      {isAuthOpen ? (
        <AuthModal
          isOpen={isAuthOpen}
          mode={authMode}
          onClose={() => setIsAuthOpen(false)}
          onModeChange={setAuthMode}
        />
      ) : null}
    </div>
  );
}
