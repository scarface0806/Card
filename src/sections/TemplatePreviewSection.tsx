'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { fetchTemplates } from '@/services/api';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

interface Template {
  id: number;
  name: string;
  plan: string;
  image: string;
}

export default function TemplatePreviewSection() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const data = await fetchTemplates();
        setTemplates(data.slice(0, 3)); // Show only first 3
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
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
    <section className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto max-w-6xl px-6 sm:px-8 md:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-14"
        >
          {/* Small Label */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full mb-6">
            <span className="text-sm font-medium text-teal-700">Templates</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
            Premium{' '}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Templates
            </span>
          </h2>
          <p className="text-lg text-[#4b635d] max-w-2xl mx-auto">
            Choose from our collection of expertly designed templates
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
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {templates.map((template) => (
              <motion.div
                key={template.id}
                variants={itemVariants}
                whileHover={{ y: -4 }}
                className="group bg-white rounded-2xl border border-teal-100 shadow-md hover:shadow-lg overflow-hidden transition-all duration-300"
              >
                <div className="relative pt-[100%] bg-gradient-to-br from-teal-50 to-emerald-50 overflow-hidden">
                  <span className="absolute inset-0 flex items-center justify-center text-[#6b7f78]">
                    Template Preview
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-bold text-lg text-[#0f2e25] font-space-grotesk">{template.name}</h3>
                    <span className="px-3 py-1 bg-teal-50 text-teal-700 text-xs font-semibold rounded-full capitalize border border-teal-200">
                      {template.plan}
                    </span>
                  </div>
                  <Link href={ROUTES.ORDER}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 rounded-xl font-semibold transition-all duration-300"
                    >
                      Use Template
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
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
          <Link href={ROUTES.TEMPLATES}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-teal-700 bg-white border border-teal-200 rounded-xl hover:bg-teal-50 hover:border-teal-300 transition-all duration-300"
            >
              View All Templates
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
