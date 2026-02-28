'use client';

import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

// Premium motion config - no bounce, no spring
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.96,
    y: 8,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
  },
};

const motionConfig = {
  duration: 0.22,
  ease: [0.25, 0.1, 0.25, 1],
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.15, ease: 'linear' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40"
          />
          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={motionConfig}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl z-50 max-w-2xl max-h-[90vh] overflow-y-auto w-[95%]"
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 md:p-6 flex items-center justify-between">
              {title && <h2 className="text-2xl font-bold text-gray-900">{title}</h2>}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                style={{ transition: 'background-color 150ms ease' }}
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-4 md:p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
