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
  accentColor: 'blue' | 'gray' | 'green';
  description: string;
}[] = [
  {
    id: 'school',
    icon: GraduationCap,
    title: 'School ID Cards',
    cardGradient: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
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
    cardGradient: 'linear-gradient(135deg, #374151 0%, #111827 100%)',
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
    cardGradient: 'linear-gradient(135deg, #0d9488 0%, #047857 100%)',
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
    <section className="relative py-24 md:py-32 bg-gradient-to-b from-[#0a0e1a] via-[#0f1528] to-[#0b1220] overflow-hidden">
      {/* Subtle gradient glow background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="site-container relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 md:mb-20"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Enterprise Solutions</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold font-space-grotesk mb-4 tracking-tight">
              <span className="text-white">Other NFC Card</span>
              {' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                Solutions
              </span>
            </h2>
            <p className="text-base md:text-lg text-gray-400 max-w-2xl">
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
            className="text-center mt-16"
          >
            <p className="body-base text-gray-400">
              Need a custom solution?{' '}
              <button
                onClick={() => onContactClick('custom')}
                className="text-primary font-semibold hover:underline"
              >
                Talk to our team
              </button>
            </p>
          </motion.div>
        </div>
      </section>
  );
}
