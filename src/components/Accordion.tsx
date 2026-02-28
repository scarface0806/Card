'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Premium motion config - consistent across site
const motionConfig = {
  duration: 0.22,
  ease: [0.25, 0.1, 0.25, 1],
};

interface AccordionItem {
  id: string;
  title: string;
  content: string;
}

interface AccordionProps {
  items: AccordionItem[];
}

export default function Accordion({ items }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id || null);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="border border-gray-200 rounded-xl overflow-hidden bg-white"
        >
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
            style={{ transition: 'background-color 150ms ease' }}
          >
            <h3 className="text-left font-semibold text-gray-900">{item.title}</h3>
            <motion.div
              initial={false}
              animate={{ rotate: openId === item.id ? 180 : 0 }}
              transition={{ duration: motionConfig.duration, ease: motionConfig.ease }}
            >
              <ChevronDown className="w-5 h-5 text-gray-500" />
            </motion.div>
          </button>
          <AnimatePresence initial={false}>
            {openId === item.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ 
                  height: { duration: 0.22, ease: [0.25, 0.1, 0.25, 1] },
                  opacity: { duration: 0.15, ease: 'linear' }
                }}
                className="border-t border-gray-100 bg-gray-50/50"
              >
                <p className="p-4 md:p-6 text-gray-600 leading-relaxed">{item.content}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
