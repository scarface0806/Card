'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, ArrowRight, Sparkles, Check, Wifi, MessageSquare } from 'lucide-react';
import CardPreviewModal from '@/components/CardPreviewModal';
import { cardTemplates, CardTemplate } from '@/utils/cardTemplates';
import { ROUTES } from '@/utils/constants';

interface CardDesignsHomeSectionProps {
  onContactClick?: (source: string) => void;
}

export default function CardDesignsHomeSection({ onContactClick }: CardDesignsHomeSectionProps) {
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<CardTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const cardDesigns = cardTemplates;

  const handlePreview = (card: CardTemplate) => {
    setSelectedCard(card);
    setIsPreviewOpen(true);
  };

  const handleBuyNow = (card: CardTemplate) => {
    if (card.type === 'custom') {
      onContactClick?.('custom');
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
      <section className="section-spacing bg-white">
        <div className="site-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="section-header"
          >
            <div className="section-badge">
              <Sparkles className="w-4 h-4" />
              <span>Premium NFC Cards</span>
            </div>

            <h2 className="heading-1 section-title font-space-grotesk">
              Our NFC{' '}
              <span className="text-gradient">
                Card Designs
              </span>
            </h2>
            <p className="body-lg section-subtitle">
              Choose your style. <a href="/preview-website" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700">Free Lifetime Website</a>.
            </p>

            {/* Subtle urgency signal */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <span className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                <Check className="w-4 h-4 text-teal-600" />
                No Hidden Charges
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                <Check className="w-4 h-4 text-teal-600" />
                No Renewal Fees
              </span>
              <span className="inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-2 rounded-full font-medium">
                <Sparkles className="w-4 h-4" />
                Limited Custom Designs Available
              </span>
            </div>
          </motion.div>

          {/* Card Grid */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-20 items-stretch"
          >
            {cardDesigns.map((card) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                className="group flex flex-col h-full card overflow-hidden hover:-translate-y-2 transition-all duration-300 hover:shadow-xl"
              >
                {/* Card Preview */}
                <div className="relative aspect-[1.6/1] overflow-hidden">
                  <div
                    className="absolute inset-0 flex items-center justify-center p-6"
                    style={{ background: card.color }}
                  >
                    {/* NFC Card Mockup */}
                    <div className="relative w-full h-full rounded-xl overflow-hidden">
                      <div className="absolute inset-0 flex flex-col justify-between p-4">
                        {/* NFC Icon */}
                        <div className="flex justify-end">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Wifi className="w-4 h-4 text-white rotate-45" />
                          </div>
                        </div>
                        {/* Card Info */}
                        <div className="text-white">
                          <p className="text-white/70 text-xs">Your Name</p>
                          <p className="font-bold">John Doe</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => handlePreview(card)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-teal-700 font-medium rounded-full hover:bg-teal-50 transition-all duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      Quick View
                    </button>
                  </div>
                </div>

                {/* Card Details */}
                <div className="flex flex-col flex-grow card-padding">
                  <div className="mb-3">
                    <h3 className="heading-3 section-title font-space-grotesk">
                      {card.name}
                    </h3>
                  </div>

                  {/* Price Section */}
                  <div className="mb-3">
                    <p className="heading-3 text-teal-700">
                      {card.type === 'custom' ? '₹599' : card.price}
                    </p>
                    <p className="body-base text-[#4b635d]">
                      {card.type === 'custom' ? 'Base NFC Card Price' : <a href="/preview-website" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700">Free Lifetime Website</a>}
                    </p>
                  </div>

                  {/* Feature Info Section */}
                  <div className="min-h-[72px] mb-4">
                    {card.type === 'custom' ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                        <p className="text-xs text-purple-700 font-medium mb-1">Design Charges</p>
                        <p className="text-xs text-[#4b635d]">
                          <span className="text-teal-600 font-semibold">Free</span> if you provide your own design.
                          Design service available at additional cost.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-[#4b635d] flex items-center gap-1">
                        <Check className="w-3 h-3 text-teal-600" />
                        Contact form included in your digital profile
                      </p>
                    )}
                  </div>

                  {/* Button */}
                  <div className="mt-auto">
                    <button
                      onClick={() => handleBuyNow(card)}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-full transition-all duration-300 group/btn ${
                        card.type === 'custom'
                          ? 'bg-[#0f2e25] hover:bg-[#1a4a3d] text-white'
                          : 'bg-gradient-to-r from-teal-600 to-green-600 text-white shadow-md hover:shadow-lg'
                      }`}
                    >
                      {card.type === 'custom' ? (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          <span>Get Started</span>
                        </>
                      ) : (
                        <>
                          <span>Buy Now</span>
                          <ArrowRight className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform duration-300" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA: Lifetime Website Benefit */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-3xl p-10 md:p-14 border border-teal-100"
          >
            <div className="max-w-3xl mx-auto text-center">
              <h3 className="heading-1 text-[#0f2e25] font-space-grotesk mb-3">
                Every NFC Card Includes a <a href="/preview-website" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700">Free Lifetime Website</a>
              </h3>
              <p className="body-lg text-[#4b635d] mb-8">
                No hidden charges. No renewal fees.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={ROUTES.CREATE_CARD}>
                  <button className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-green-600 text-white font-semibold rounded-full transition-all duration-220 shadow-md hover:shadow-lg hover:-translate-y-1 group">
                    <span>Get Your NFC Card</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </Link>
                <button
                  onClick={() => onContactClick?.('general')}
                  className="inline-flex items-center gap-2 px-8 py-4 border-2 border-teal-300 text-teal-700 hover:bg-teal-50 font-semibold rounded-full transition-all duration-300"
                >
                  <span>Learn More</span>
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
