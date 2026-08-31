'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, ArrowUpRight, Loader2 } from 'lucide-react';
import CardPreviewModal from '@/components/CardPreviewModal';
import CardFace from '@/components/CardFace';
import { useCardDesigns, CardDesign } from '@/hooks/useCardDesigns';
import { ROUTES } from '@/utils/constants';
import { ContactSource } from '@/components/ContactModal';

interface CardDesignsHomeSectionProps {
  onContactClick: (source: ContactSource) => void;
}

export default function CardDesignsHomeSection({ onContactClick }: CardDesignsHomeSectionProps) {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<CardDesign | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const { cardDesigns, loading } = useCardDesigns();

  const handlePreview = (card: CardDesign) => {
    setSelectedCard(card);
    setIsPreviewOpen(true);
  };

  const handleBuyNow = (card: CardDesign) => {
    if (card.type === 'custom') {
      onContactClick('custom');
      return;
    }
    router.push(`/create-card?template=${card.slug}`);
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
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <>
      <section className="tv-surface-graphite tv-section">
        <div className="site-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 md:mb-16"
          >
            <div className="max-w-xl">
              <p className="tv-eyebrow mb-6">The cards</p>
              <h2 className="tv-h2 mb-4">Choose your card.</h2>
              <p className="tv-lead">
                Every card carries the same chip and the same profile. Pick the one you
                want to hand over.
              </p>
            </div>

            <ul className="flex flex-wrap gap-x-6 gap-y-2 lg:justify-end shrink-0">
              <li className="tv-mono">No hidden charges</li>
              <li className="tv-mono">No renewal fees</li>
            </ul>
          </motion.div>

          {/* Card Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#4CAE89] animate-spin" aria-hidden="true" />
              <span className="sr-only">Loading card designs</span>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 mb-16 md:mb-20 items-stretch"
            >
              {cardDesigns.map((card) => (
                <motion.article
                  key={card.id}
                  variants={itemVariants}
                  className="group tv-panel flex flex-col h-full overflow-hidden"
                >
                  {/* Card Preview */}
                  <div className="relative aspect-[1.6/1] overflow-hidden bg-[#151C1A]">
                    {/* Photograph where there is one, the drawn finish
                        otherwise — same rule as the /cards catalogue. */}
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
                      <CardFace
                        name={card.name}
                        color={card.color}
                        label={card.material || undefined}
                      />
                    )}

                    {/* Quick view overlay. Also reachable on keyboard: the
                        button stays focusable and the overlay reveals on
                        focus-within, not hover alone. */}
                    <div className="absolute inset-0 flex items-center justify-center bg-[#070A09]/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
                      <button
                        onClick={() => handlePreview(card)}
                        className="tv-btn tv-btn-secondary !text-[#F1F3F1] !border-[#F1F3F1]/40 !bg-[#070A09]/70"
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                        Quick view
                        <span className="sr-only"> of {card.name}</span>
                      </button>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="flex flex-col grow tv-panel-pad">
                    <h3 className="tv-h4 mb-3">{card.name}</h3>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline gap-2.5">
                        <p
                          className="text-2xl font-semibold text-[#F1F3F1]"
                          style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
                        >
                          {card.price}
                        </p>
                        {card.salePrice && card.salePriceValue && card.salePriceValue < card.priceValue && (
                          <p
                            className="text-sm line-through text-[#A9B5B0]"
                            style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
                          >
                            {card.salePrice}
                          </p>
                        )}
                      </div>
                      {/* The lifetime-website claim deliberately does NOT
                          appear here: this line renders once per card, so
                          putting it here reprinted it five times. It now
                          appears once, in the band below the grid. */}
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
                          <p className="tv-spec-row">
                            Free if you provide your own design
                          </p>
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
                        take the tertiary contact label, not the buy label. */}
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
            </motion.div>
          )}

          {/* Lifetime website band — one of only two places this claim now
              appears on the homepage (the other is the price line above). */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="border-t border-b border-[#C9A961]/25 py-12 md:py-16"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7">
                <p className="tv-eyebrow mb-5">Included with every card</p>
                <h3 className="tv-h2 mb-3">
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
                </h3>
                <p className="tv-body tv-measure-body">No hidden charges. No renewal fees.</p>
              </div>

              <div className="lg:col-span-5 flex flex-col sm:flex-row lg:justify-end items-start sm:items-center gap-x-6 gap-y-4">
                <Link href={ROUTES.CREATE_CARD} className="tv-btn tv-btn-lg tv-btn-gilded tv-btn-block">
                  <span>Get your card</span>
                  <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                </Link>
                <button onClick={() => onContactClick('general')} className="tv-btn-tertiary">
                  Talk to our team
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Preview Modal */}
      <CardPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        card={selectedCard}
      />
    </>
  );
}
