'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Wifi } from 'lucide-react';
import { CardTemplate } from '@/utils/cardTemplates';

interface CardLivePreviewProps {
  fullName: string;
  designation: string;
  company: string;
  template: CardTemplate;
}

export default function CardLivePreview({
  fullName,
  designation,
  company,
  template,
}: CardLivePreviewProps) {
  return (
    <div 
      className="rounded-xl pt-[63%] relative overflow-hidden border border-gray-200 shadow-lg transition-all duration-300"
      style={{ background: template.color }}
    >
      {/* NFC Icon */}
      <div className="absolute top-4 right-4">
        <Wifi className="w-6 h-6 text-white/60 rotate-45" />
      </div>
      
      {/* Shine effect */}
      <div className="absolute inset-0 bg-linear-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
      
      {/* Card Content Preview */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-linear-to-t from-black/70 via-black/40 to-transparent">
        <AnimatePresence mode="wait">
          <motion.h3
            key={fullName || 'name-placeholder'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="text-white font-semibold text-base md:text-lg leading-tight break-words line-clamp-2"
          >
            {fullName || 'Your Name'}
          </motion.h3>
        </AnimatePresence>
        
        <AnimatePresence mode="wait">
          <motion.p
            key={designation || 'designation-placeholder'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15, delay: 0.02 }}
            className="text-white/80 text-xs md:text-sm leading-tight break-words line-clamp-1 mt-0.5"
          >
            {designation || 'Your Designation'}
          </motion.p>
        </AnimatePresence>
        
        <AnimatePresence mode="wait">
          {company && (
            <motion.p
              key={company}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15, delay: 0.04 }}
              className="text-white/60 text-xs leading-tight break-words line-clamp-1 mt-0.5"
            >
              {company}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

