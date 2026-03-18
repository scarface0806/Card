'use client';

import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, Building2, Sparkles } from 'lucide-react';
import BulkCard from '@/components/BulkCard';
import { ContactSource } from '@/components/ContactModal';

const bulkSolutions: {
  id: ContactSource;
  icon: typeof GraduationCap;
  title: string;
  cardGradient: string;
  features: string[];
}[] = [
  {
    id: 'school',
    icon: GraduationCap,
    title: 'School ID Cards',
    cardGradient: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
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
    cardGradient: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
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
    cardGradient: 'linear-gradient(135deg, #0d9488 0%, #047857 100%)',
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
    <section className="section-spacing section-alt">
      <div className="site-container">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="section-header"
          >
            {/* Badge */}
            <div className="section-badge">
              <Sparkles className="w-4 h-4" />
              <span>Enterprise Solutions</span>
            </div>

            <h2 className="heading-1 section-title font-space-grotesk">
              Other NFC Card{' '}
              <span className="text-gradient">
                Solutions
              </span>
            </h2>
            <p className="text-sm md:text-base text-slate-500 section-subtitle">
              Bulk NFC card solutions for schools, businesses, and organizations.
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
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
            className="text-center mt-16"
          >
            <p className="body-base text-[#6b7f78]">
              Need a custom solution?{' '}
              <button
                onClick={() => onContactClick('custom')}
                className="text-teal-600 font-semibold hover:underline"
              >
                Talk to our team
              </button>
            </p>
          </motion.div>
        </div>
      </section>
  );
}
