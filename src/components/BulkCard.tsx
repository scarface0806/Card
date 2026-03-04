'use client';

import { motion } from 'framer-motion';
import { Check, ArrowRight, Wifi } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface BulkCardProps {
  icon: LucideIcon;
  title: string;
  features: string[];
  cardGradient?: string;
  onContactClick: () => void;
}

export default function BulkCard({ icon: Icon, title, features, cardGradient = 'linear-gradient(135deg, #374151 0%, #111827 100%)', onContactClick }: BulkCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-3xl shadow-lg border border-teal-100 p-8 flex flex-col h-full"
    >
      {/* Card Preview Visual */}
      <div className="h-40 rounded-2xl bg-linear-to-br from-teal-50 to-white flex items-center justify-center mb-6 shadow-inner border border-teal-100/50">
        <div 
          className="w-48 h-28 rounded-xl shadow-lg relative overflow-hidden"
          style={{ background: cardGradient }}
        >
          {/* NFC Icon */}
          <div className="absolute top-2 right-2">
            <Wifi className="w-4 h-4 text-white/40 rotate-45" />
          </div>
          {/* Card Lines */}
          <div className="absolute bottom-3 left-3 right-3 space-y-1.5">
            <div className="h-2 bg-white/30 rounded w-3/4" />
            <div className="h-1.5 bg-white/20 rounded w-1/2" />
          </div>
          {/* Icon Badge */}
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Icon className="w-3 h-3 text-white/60" />
          </div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
        {title}
      </h3>

      {/* Features */}
      <ul className="space-y-3 mb-8 grow">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-teal-600" />
            </div>
            <span className="text-[#4b635d] text-sm leading-relaxed">{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <motion.button
        onClick={onContactClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0f2e25] text-white font-semibold rounded-xl hover:bg-[#1a4a3d] transition-all duration-300 group"
      >
        Contact Us
        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
      </motion.button>
    </motion.div>
  );
}

