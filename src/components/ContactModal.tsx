'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building2, Phone, Palette } from 'lucide-react';

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
  email: string;
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
    email: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const config = sourceConfig[source] || sourceConfig.general;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const service = source === 'general' ? formData.companyName.trim() || 'General Inquiry' : source;

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.fullName,
          phone: formData.contactNumber,
          email: formData.email,
          subject: `${config.title}${formData.hasOwnDesign ? ` (${formData.hasOwnDesign})` : ''}`,
          message: `${formData.message}${formData.companyName ? `\nCompany/School: ${formData.companyName}` : ''}`,
          service,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to submit inquiry');
      }

      setFormData({ fullName: '', companyName: '', contactNumber: '', message: '', hasOwnDesign: '', email: '' });
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit inquiry');
    } finally {
      setIsSubmitting(false);
    }
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
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="tv-modal-backdrop z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            {/* role/aria-modal/aria-labelledby are markup only - they tell
                assistive tech what this already is. No behaviour added. */}
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="contact-modal-title"
              className="tv-modal-panel max-w-lg pointer-events-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="tv-modal-close z-10"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Header */}
              <div className="tv-modal-head pr-14">
                <h2 id="contact-modal-title" className="tv-h3 mb-1">
                  {config.title}
                </h2>
                <p className="tv-small">{config.subtitle}</p>
              </div>

              {/* Form. Every field now has a real <label> tied to it by id -
                  these inputs previously relied on the placeholder alone,
                  which vanishes as soon as anyone types. The `name`
                  attributes are untouched. */}
              <form onSubmit={handleSubmit}>
                <div className="tv-modal-body">
                  <div className="tv-field">
                    <label htmlFor="cm-fullName" className="tv-label">
                      Full name
                    </label>
                    <div className="relative">
                      <User
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        id="cm-fullName"
                        name="fullName"
                        autoComplete="name"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                        className="tv-input !pl-10"
                      />
                    </div>
                  </div>

                  <div className="tv-field">
                    <label htmlFor="cm-companyName" className="tv-label">
                      Company or school
                    </label>
                    <div className="relative">
                      <Building2
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        type="text"
                        id="cm-companyName"
                        name="companyName"
                        autoComplete="organization"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Organisation name"
                        required
                        className="tv-input !pl-10"
                      />
                    </div>
                  </div>

                  <div className="tv-field">
                    <label htmlFor="cm-contactNumber" className="tv-label">
                      Contact number
                    </label>
                    <div className="relative">
                      <Phone
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none"
                        aria-hidden="true"
                      />
                      <input
                        type="tel"
                        id="cm-contactNumber"
                        name="contactNumber"
                        inputMode="tel"
                        autoComplete="tel"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="9876543210"
                        required
                        className="tv-input !pl-10"
                      />
                    </div>
                  </div>

                  <div className="tv-field">
                    <label htmlFor="cm-email" className="tv-label">
                      Email
                    </label>
                    <input
                      type="email"
                      id="cm-email"
                      name="email"
                      inputMode="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      required
                      className="tv-input"
                    />
                  </div>

                  {/* Design Option - Only for Custom Card */}
                  {source === 'custom' && (
                    <div className="tv-field">
                      <label htmlFor="cm-hasOwnDesign" className="tv-label">
                        Do you have your own design?
                      </label>
                      <div className="relative">
                        <Palette
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none z-10"
                          aria-hidden="true"
                        />
                        <select
                          id="cm-hasOwnDesign"
                          name="hasOwnDesign"
                          aria-label="Do you have your own design?"
                          value={formData.hasOwnDesign}
                          onChange={handleChange}
                          required
                          className="tv-select !pl-10"
                        >
                          <option value="" disabled>
                            Select an option
                          </option>
                          <option value="yes">Yes, I have my own design</option>
                          <option value="no">No, I need design support</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="tv-field">
                    <label htmlFor="cm-message" className="tv-label">
                      Requirements
                    </label>
                    <textarea
                      id="cm-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your requirements"
                      required
                      rows={4}
                      className="tv-textarea"
                    />
                  </div>

                  {submitError ? (
                    <p className="tv-form-error mt-1" role="alert">
                      {submitError}
                    </p>
                  ) : null}
                </div>

                <div className="tv-modal-foot">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ y: -2 }}
                    whileTap={{ y: 0 }}
                    className="tv-btn tv-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending…' : 'Send enquiry'}
                  </motion.button>

                  <p className="tv-small text-center mt-3">
                    We&apos;ll get back to you within 24 hours
                  </p>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
