'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, Building2 } from 'lucide-react';
import BulkCard from '@/components/BulkCard';
import { ContactSource } from '@/components/ContactModal';

const bulkSolutions: {
  id: ContactSource;
  icon: typeof GraduationCap;
  title: string;
  cardGradient: string;
  features: string[];
  accentColor: 'blue' | 'gray' | 'green';
  description: string;
}[] = [
  // The "updated 3 times free" bullet on all three products is a deliberate
  // exemption from the ₹49-per-update rule that applies to single-card orders,
  // confirmed by the owner on 5 September 2026 and written into section 7 of
  // /terms-conditions. It is NOT a leftover from before that rule.
  //
  // If bulk ever moves onto the ₹49 terms, these three bullets and the bulk
  // bullet in Terms section 7 have to change together, or the site contradicts
  // its own published terms.
  {
    id: 'school',
    icon: GraduationCap,
    title: 'School ID Cards',
    cardGradient: 'linear-gradient(145deg, #2E5A78 0%, #1B3A52 45%, #0B1E2E 100%)',
    accentColor: 'blue',
    description: 'Smart NFC ID cards for educational institutions',
    features: [
      'Minimum order: 25 cards',
      'Fully customized card design',
      'Each card includes a student information webpage',
      'Website information can be updated 3 times free',
    ],
  },
  {
    id: 'business',
    icon: Briefcase,
    title: 'Business Cards (Bulk Orders)',
    cardGradient: 'linear-gradient(145deg, #2C3134 0%, #171B1D 45%, #0A0C0D 100%)',
    accentColor: 'gray',
    description: 'Professional NFC business cards for teams',
    features: [
      'Minimum order: 25 cards',
      'Custom designed NFC business cards',
      'Each card includes a digital profile with contact form',
      'Website information can be updated 3 times free',
    ],
  },
  {
    id: 'corporate',
    icon: Building2,
    title: 'Corporate ID Cards',
    cardGradient: 'linear-gradient(145deg, #328565 0%, #1B5A44 45%, #0B3125 100%)',
    accentColor: 'green',
    description: 'Enterprise-grade employee ID cards with NFC',
    features: [
      'Minimum order: 25 cards',
      'Custom company branding',
      'Each card includes employee information webpage',
      'Website information can be updated 3 times free',
    ],
  },
];

interface OtherCardsSolutionsSectionProps {
  onContactClick: (source: ContactSource) => void;
}

export default function OtherCardsSolutionsSection({ onContactClick }: OtherCardsSolutionsSectionProps) {
  return (
    <section className="tv-surface-graphite tv-section relative overflow-hidden">
      <div className="site-container relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mb-12 md:mb-16"
          >
            <p className="tv-eyebrow mb-6">Bulk orders</p>

            <h2 className="tv-h2 mb-4">Cards for a whole team, school or company.</h2>

            <p className="tv-lead tv-measure-body">
              Custom-designed NFC cards in bulk, each one with its own webpage.
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {bulkSolutions.map((solution, idx) => (
              <motion.div
                key={solution.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <BulkCard
                  icon={solution.icon}
                  title={solution.title}
                  features={solution.features}
                  cardGradient={solution.cardGradient}
                  accentColor={solution.accentColor}
                  description={solution.description}
                  onContactClick={() => onContactClick(solution.id)}
                />
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 md:mt-14 flex flex-wrap items-center gap-x-3 gap-y-2"
          >
            <p className="tv-body">Need something different?</p>
            <button onClick={() => onContactClick('custom')} className="tv-btn-tertiary">
              Talk to our team
            </button>
          </motion.div>
        </div>
      </section>
  );
}
