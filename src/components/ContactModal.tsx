'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building2, Phone, MessageSquare, Palette } from 'lucide-react';

export type ContactSource = 'custom' | 'school' | 'business' | 'corporate' | 'general';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: ContactSource;
}

interface FormData {
  fullName: string;
  companyName: string;
  contactNumber: string;
  message: string;
  hasOwnDesign: string;
}

const sourceConfig: Record<ContactSource, { title: string; subtitle: string }> = {
  custom: {
    title: 'Custom NFC Card Inquiry',
    subtitle: 'Tell us about your custom card requirements',
  },
  school: {
    title: 'School ID Card Inquiry',
    subtitle: 'Bulk order for educational institutions',
  },
  business: {
    title: 'Business Bulk Order Inquiry',
    subtitle: 'Custom NFC business cards for your team',
  },
  corporate: {
    title: 'Corporate ID Card Inquiry',
    subtitle: 'Employee ID cards with NFC technology',
  },
  general: {
    title: 'Get a Quote',
    subtitle: 'We\'ll get back to you within 24 hours',
  },
};

export default function ContactModal({ isOpen, onClose, source }: ContactModalProps) {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    companyName: '',
    contactNumber: '',
    message: '',
    hasOwnDesign: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const config = sourceConfig[source] || sourceConfig.general;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    setIsSubmitting(false);
    setFormData({ fullName: '', companyName: '', contactNumber: '', message: '', hasOwnDesign: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative bg-white rounded-3xl shadow-lg max-w-md w-full p-10 pointer-events-auto\">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-[#0f2e25] font-space-grotesk">
                  {config.title}
                </h3>
                <p className="text-[#4b635d] mt-2">
                  {config.subtitle}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Full Name */}
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Full Name *"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-200 text-[#0f2e25] placeholder:text-[#6b7f78]"
                  />
                </div>

                {/* Company/School Name */}
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder="Company or School Name *"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-200 text-[#0f2e25] placeholder:text-[#6b7f78]"
                  />
                </div>

                {/* Contact Number */}
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="Contact Number *"
                    required
                    className="w-full pl-12 pr-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-200 text-[#0f2e25] placeholder:text-[#6b7f78]"
                  />
                </div>

                {/* Design Option - Only for Custom Card */}
                {source === 'custom' && (
                  <div className="relative">
                    <Palette className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-teal-500" />
                    <select
                      name="hasOwnDesign"
                      value={formData.hasOwnDesign}
                      onChange={handleChange}
                      required
                      className="w-full pl-12 pr-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-200 text-[#0f2e25] appearance-none bg-white cursor-pointer"
                    >
                      <option value="" disabled>Do you have your own design? *</option>
                      <option value="yes">Yes, I have my own design</option>
                      <option value="no">No, I need design support</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-teal-500" />
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your requirements *"
                    required
                    rows={4}
                    className="w-full pl-12 pr-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all duration-200 text-[#0f2e25] placeholder:text-[#6b7f78] resize-none"
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-teal-700 text-white font-semibold py-3 rounded-xl hover:bg-teal-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    'Submit Inquiry'
                  )}
                </motion.button>
              </form>

              <p className="text-xs text-[#6b7f78] text-center mt-6">
                We'll get back to you within 24 hours
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
