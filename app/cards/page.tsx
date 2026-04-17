'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import CardPreviewModal from '@/components/CardPreviewModal';
import ContactModal, { ContactSource } from '@/components/ContactModal';
import AuthModal from '@/components/AuthModal';
import OtherCardsSolutionsSection from '@/sections/OtherCardsSolutionsSection';
import { motion } from 'framer-motion';
import { Eye, ArrowRight, Sparkles, Check, MessageSquare, Loader2 } from 'lucide-react';
import { useCardDesigns, CardDesign } from '@/hooks/useCardDesigns';

const lifetimeFeatures = [
  'Free hosting forever',
  'Contact form included',
  'Mobile responsive design',
  'Unlimited profile views',
  'No renewal fees',
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
    <div className="frontend-dark">
      <Navbar />
      <main className="pt-32 pb-20 min-h-screen bg-gradient-to-br from-[#f8fafb] via-[#eef5f3] to-[#ffffff]">
        <div className="site-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Premium NFC Cards</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0f2e25] font-space-grotesk mb-4 tracking-tight">
              Our NFC{' '}
              <span className="text-primary">
                Card Designs
              </span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto">
              Choose your style. <a href="/preview-website" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary">Free Lifetime Website</a>.
            </p>
          </motion.div>

          {/* Card Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20"
          >
            {cardDesigns.map((card) => (
              <motion.div
                key={card.id}
                variants={itemVariants}
                className="group flex flex-col h-full bg-white rounded-3xl shadow-lg border border-gray-200/60 overflow-hidden hover:-translate-y-2 transition-all duration-300 hover:shadow-xl"
              >
                {/* Card Preview */}
                <div className="relative aspect-[1.6/1] overflow-hidden">
                  <img src={card.images?.[0] || "/placeholder.svg"} alt={card.name} className="h-full w-full object-cover" />

                  {/* Quick View Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                      onClick={() => handlePreview(card)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white text-primary font-medium rounded-full hover:bg-primary/10 transition-all duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      Quick View
                    </button>
                  </div>
                </div>

                {/* Card Details */}
                <div className="flex flex-col flex-grow p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-[#0f2e25] font-space-grotesk">
                      {card.name}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        card.type === 'premium'
                          ? 'bg-amber-100 text-amber-700'
                          : card.type === 'custom'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {card.type === 'custom' ? 'Custom' : card.type === 'premium' ? 'Premium' : 'Basic'}
                    </span>
                  </div>

                  {/* Price Section */}
                  <div className="mb-3">
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-bold text-primary">
                        {card.price}
                      </p>
                      {card.salePrice && card.salePriceValue && card.salePriceValue < card.priceValue && (
                        <p className="text-sm text-gray-400 line-through">
                          {card.salePrice}
                        </p>
                      )}
                    </div>
                    <p className="text-sm text-[#4b635d]">
                      {card.type === 'custom' ? 'Base NFC Card Price' : <a href="/preview-website" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary">Free Lifetime Website</a>}
                    </p>
                  </div>

                  {/* Feature Info Section - Fixed Height */}
                  <div className="min-h-[72px] mb-4">
                    {card.type === 'custom' ? (
                      <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                        <p className="text-xs text-purple-700 font-medium mb-1">Design Charges</p>
                        <p className="text-xs text-[#4b635d]">
                          <span className="text-primary font-semibold">Free</span> if you provide your own design.
                          Design service available at additional cost.
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-[#4b635d] flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" />
                        Contact form included in your digital profile
                      </p>
                    )}
                  </div>

                  {/* Button - Pushed to Bottom */}
                  <div className="mt-auto">
                    <button
                      onClick={() => handleBuyNow(card)}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 font-medium rounded-full transition-all duration-300 group/btn ${
                        card.type === 'custom'
                          ? 'bg-gradient-to-r from-primary to-secondary text-[#0f2e25] shadow-md hover:shadow-lg hover:from-[#28A428] hover:to-[#e6e600]'
                          : 'bg-gradient-to-r from-primary to-secondary text-[#0f2e25] shadow-md hover:shadow-lg hover:from-[#28A428] hover:to-[#e6e600]'
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
          )}
        </div>
      </main>

      {/* Other NFC Card Solutions Section */}
      <OtherCardsSolutionsSection onContactClick={openContactModal} />

      {/* Lifetime Website Info Section */}
      <section className="py-20 bg-white">
        <div className="site-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-primary/10 rounded-3xl p-10 md:p-16"
          >
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#0f2e25] font-space-grotesk mb-4 tracking-tight">
                  Every Card Includes a <a href="/preview-website" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary">Free Lifetime Website</a>
                </h2>
                <p className="text-base md:text-lg text-slate-500">
                  Your personal digital profile that works forever — no hidden costs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {lifetimeFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-5 text-center shadow-sm border border-gray-200/60"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-[#0f2e25]">{feature}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Need Help Choosing Section */}
      <section className="py-20 bg-white">
        <div className="site-container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h3 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#0f2e25] font-space-grotesk mb-4 tracking-tight">
              Need Help Choosing?
            </h3>
            <p className="text-sm md:text-base text-slate-500 mb-6 max-w-xl mx-auto">
              Our team is here to help you pick the perfect card for your brand.
            </p>
            <button 
              onClick={() => openContactModal('general')}
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-primary/20 text-primary hover:border-primary/30 hover:bg-primary/10 font-semibold rounded-full transition-all duration-300"
            >
              Talk to Our Team
            </button>
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
