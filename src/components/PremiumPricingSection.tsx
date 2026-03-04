'use client';

import { motion, easeOut } from 'framer-motion';
import { Check } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import PremiumButton from '@/components/PremiumButton';
import Heading from '@/components/Heading';
import Text from '@/components/Text';
import { ROUTES } from '@/utils/constants';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

const plans = [
  {
    name: 'Starter',
    price: '₹999',
    period: '/month',
    description: 'Perfect for individuals',
    features: [
      'One Digital Card',
      'Basic Customization',
      'Analytics',
      'Mobile-Optimized',
      'Email Support',
    ],
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '₹1,999',
    period: '/month',
    description: 'For growing teams',
    features: [
      'Unlimited Cards',
      'Advanced Customization',
      'Full Analytics',
      'Team Management',
      '24/7 Priority Support',
      'API Access',
    ],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    description: 'For large organizations',
    features: [
      'Everything in Professional',
      'White Label Solution',
      'Dedicated Account Manager',
      'Custom Integration',
      'Advanced Security',
      'SLA Guarantee',
    ],
    highlighted: false,
  },
];

export default function PremiumPricingSection() {
  return (
    <section className="relative py-20 md:py-32 bg-dark-bg overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="container mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <Heading as="h2" className="mb-4">
            Simple, Transparent Pricing
          </Heading>
          <Text variant="body-lg" className="text-white/70 max-w-2xl mx-auto">
            Choose the plan that scales with your business
          </Text>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {plans.map((plan) => (
            <motion.div
              key={plan.name}
              variants={itemVariants}
              className={plan.highlighted ? 'md:scale-105' : ''}
            >
              <GlassCard
                glow={plan.highlighted}
                className={plan.highlighted ? 'relative' : ''}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-linear-to-r from-violet-600 to-cyan-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="font-space-grotesk font-bold text-2xl text-white mb-2">
                    {plan.name}
                  </h3>
                  <Text variant="body-sm" className="text-white/60">
                    {plan.description}
                  </Text>
                </div>

                <div className="mb-6 pb-6 border-b border-white/10">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-white/60">{plan.period}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-linear-to-br from-violet-500 to-cyan-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-white/80 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <PremiumButton
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  size="md"
                  href={ROUTES.ORDER}
                  className="w-full"
                >
                  Get Started
                </PremiumButton>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Question Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <Heading as="h3" className="mb-4">
            Have questions?
          </Heading>
          <Text variant="body" className="text-white/70 mb-6">
            Contact our sales team for custom enterprise solutions
          </Text>
          <PremiumButton variant="outline" size="md">
            Contact Sales
          </PremiumButton>
        </motion.div>
      </div>
    </section>
  );
}

