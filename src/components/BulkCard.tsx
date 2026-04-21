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
  accentColor?: 'blue' | 'gray' | 'green';
  description?: string;
}

export default function BulkCard({ 
  icon: Icon, 
  title, 
  features, 
  cardGradient = 'linear-gradient(135deg, #374151 0%, #111827 100%)', 
  onContactClick,
  accentColor = 'gray',
  description
}: BulkCardProps) {
  // Color mapping for subtle differentiation
  const colorMap = {
    blue: {
      glowColor: 'rgba(34, 197, 94, 0.15)',
      accentBg: 'bg-green-500/10',
      accentText: 'text-green-400',
      borderGlow: 'hover:shadow-[0_0_40px_rgba(34,197,94,0.2)]'
    },
    gray: {
      glowColor: 'rgba(107, 114, 128, 0.15)',
      accentBg: 'bg-gray-500/10',
      accentText: 'text-gray-400',
      borderGlow: 'hover:shadow-[0_0_40px_rgba(107,114,128,0.2)]'
    },
    green: {
      glowColor: 'rgba(34, 197, 94, 0.15)',
      accentBg: 'bg-green-500/10',
      accentText: 'text-green-400',
      borderGlow: 'hover:shadow-[0_0_40px_rgba(34,197,94,0.25)]'
    }
  };

  const colors = colorMap[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className={`relative group bg-gradient-to-b from-[#0f172a] to-[#020617] rounded-2xl border border-white/10 p-8 flex flex-col h-full transition-all duration-300 ${colors.borderGlow}`}
      style={{
        boxShadow: `0 0 40px ${colors.glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`
      }}
    >
      {/* Background gradient accent */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{background: `radial-gradient(circle at top right, ${colors.glowColor}, transparent)`}} />

      {/* Card Preview Visual */}
      <div className="relative z-10 mb-8">
        <div className="h-44 flex items-center justify-center perspective">
          {/* Glow effect behind card */}
          <div className="absolute inset-0 rounded-2xl blur-xl opacity-40" style={{background: colors.glowColor}} />
          
          <motion.div 
            className="relative w-56 h-32 rounded-xl shadow-2xl overflow-hidden transform"
            style={{ background: cardGradient }}
            whileHover={{ rotateY: 5, rotateX: -5 }}
            transition={{ duration: 0.4 }}
          >
            {/* NFC Icon */}
            <div className="absolute top-3 right-3 z-10">
              <Wifi className="w-4 h-4 text-white/50 rotate-45" />
            </div>
            {/* Card Lines */}
            <div className="absolute bottom-4 left-4 right-4 space-y-2">
              <div className="h-2 bg-white/30 rounded w-3/4" />
              <div className="h-1.5 bg-white/20 rounded w-1/2" />
            </div>
            {/* Icon Badge */}
            <div className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center border border-white/20">
              <Icon className="w-4 h-4 text-white/70" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-grow">
        {/* Title */}
        <h3 className="text-xl font-bold text-white font-space-grotesk mb-2">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-400 mb-6">
            {description}
          </p>
        )}

        {/* Features */}
        <ul className="space-y-0 mb-8 flex-grow">
          {features.map((feature, idx) => (
            <li key={idx} className={`flex items-start gap-3 py-3 ${idx !== features.length - 1 ? 'border-b border-white/5' : ''}`}>
              <div className={`w-5 h-5 rounded-full ${colors.accentBg} flex items-center justify-center shrink-0 mt-0.5`}>
                <Check className={`w-3 h-3 ${colors.accentText}`} />
              </div>
              <span className="text-gray-300 text-sm leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <motion.button
          onClick={onContactClick}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-transparent border border-white/20 hover:border-green-400 hover:bg-white/5 hover:text-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)] transition-all duration-300 ease-in-out group flex items-center justify-center gap-2"
        >
          Contact Us
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </motion.button>
      </div>
    </motion.div>
  );
}

