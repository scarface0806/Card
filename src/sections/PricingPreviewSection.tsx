'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fetchPricingPlans } from '@/services/api';
import { Check, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: string;
  description: string;
  features: string[];
  highlighted: boolean;
}

export default function PricingPreviewSection() {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const data = await fetchPricingPlans();
        setPlans(data);
      } catch (error) {
        console.error('Failed to load pricing:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' as const },
    },
  };

  return (
    <section className="section-spacing bg-white">
      <div className="site-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          {/* Small Label */}
          <div className="section-badge">
            <span>Pricing</span>
          </div>
          
          <h2 className="heading-1 section-title font-space-grotesk">
            Simple, Transparent{' '}
            <span className="text-gradient">
              Pricing
            </span>
          </h2>
          <p className="body-lg section-subtitle">
            Choose the plan that works best for you
          </p>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div
              className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent"
              aria-label="Loading"
            />
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
          >
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className={`relative bg-white rounded-2xl shadow-lg border transition-all duration-300 overflow-hidden ${
                  plan.highlighted 
                    ? 'border-2 border-teal-600 md:scale-105' 
                    : 'border-teal-100 hover:border-teal-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="bg-teal-600 text-white text-center py-2 text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <div className="card-padding">
                  <h3 className="heading-3 section-title font-space-grotesk mb-2">{plan.name}</h3>
                  <p className="body-base text-[#6b7f78] mb-6">{plan.description}</p>

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[#0f2e25]">
                      ₹{(plan.price / 100).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[#6b7f78] ml-2">/{plan.period}</span>
                  </div>

                  <Link href={ROUTES.ORDER} className="block mb-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                        plan.highlighted
                          ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-500/20'
                          : 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                      }`}
                    >
                      Choose Plan
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>

                  <div className="space-y-3">
                    {plan.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-600" />
                        </div>
                        <span className="text-[#4b635d] text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <Link href={ROUTES.PRICING}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-teal-700 bg-white border border-teal-200 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all duration-300"
            >
              View Full Pricing &amp; Compare
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
