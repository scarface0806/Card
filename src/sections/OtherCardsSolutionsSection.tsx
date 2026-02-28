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
    <section className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto max-w-6xl px-6 sm:px-8 md:px-10 lg:px-12">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12 md:mb-14"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">Enterprise Solutions</span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
              Other NFC Card{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                Solutions
              </span>
            </h2>
            <p className="text-base md:text-lg text-[#4b635d] max-w-2xl mx-auto">
              Bulk NFC card solutions for schools, businesses, and organizations.
            </p>
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
            <p className="text-[#6b7f78]">
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
