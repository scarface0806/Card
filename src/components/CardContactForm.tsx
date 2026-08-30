'use client';

/**
 * CARD ENQUIRY FORM — the "Send a message" control on a card profile.
 *
 * Presentation only: the trigger and the modal are drawn with the shared
 * .tv-modal-*, .tv-field and .tv-btn vocabulary, so this dialog matches the
 * enquiry modal on the marketing pages. Validation, the honeypot, the POST to
 * /api/cards/[slug]/leads and the auto-close on success are unchanged.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, Loader2, X, MessageSquare, ArrowUpRight } from 'lucide-react';

interface CardContactFormProps {
  cardSlug: string;
  /** Retained for compatibility. A profile is drawn in the shared system now,
      so the per-card accent colour is no longer applied here. */
  primaryColor?: string;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  website: string; // Honeypot field
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
}

type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function CardContactForm({ cardSlug, onSuccess }: CardContactFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    website: '', // Honeypot
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Validate email format
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate form
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name is too long';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (formData.phone && !/^[\d\s+()-]{7,20}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.message && formData.message.length > 2000) {
      newErrors.message = 'Message is too long (max 2000 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setStatus('submitting');
    setErrorMessage('');

    try {
      const response = await fetch(`/api/cards/${cardSlug}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          message: formData.message || undefined,
          website: formData.website, // Send honeypot field
          source: 'contact_form',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
        website: '',
      });
      onSuccess?.();

      // Close form after 3 seconds on success
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
      }, 3000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(
        error instanceof Error ? error.message : 'Something went wrong'
      );
    }
  };

  // Reset form
  const handleClose = () => {
    setIsOpen(false);
    setStatus('idle');
    setErrors({});
    setErrorMessage('');
  };

  const isSubmitting = status === 'submitting';

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(true)}
        className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block"
      >
        <MessageSquare className="w-[18px] h-[18px]" aria-hidden="true" />
        Send message
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="card-enquiry-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="tv-modal-backdrop"
              onClick={handleClose}
            />

            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="tv-modal-panel max-w-lg !rounded-b-none sm:!rounded-2xl"
            >
              <div className="tv-modal-head pr-14">
                <h2 id="card-enquiry-title" className="tv-h3">
                  Send a message
                </h2>
              </div>

              <button onClick={handleClose} className="tv-modal-close" aria-label="Close">
                <X className="w-[18px] h-[18px]" aria-hidden="true" />
              </button>

              {status === 'success' ? (
                <div className="tv-modal-body text-center py-12">
                  <span
                    className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ background: 'rgba(76, 174, 137, 0.14)' }}
                    aria-hidden="true"
                  >
                    <Check className="h-7 w-7" style={{ color: '#4CAE89' }} />
                  </span>
                  <h3 className="tv-h3 mb-2">Message sent</h3>
                  <p className="tv-body" role="status">
                    Thank you for reaching out. You&apos;ll hear back soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="tv-modal-body">
                    {status === 'error' && (
                      <div className="tv-notice tv-notice-error mb-5" role="alert">
                        <AlertCircle className="tv-notice-icon h-4 w-4" aria-hidden="true" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <div className="tv-field">
                      <label htmlFor="name" className="tv-label">
                        Name<span className="tv-label-req">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        autoComplete="name"
                        className="tv-input"
                        disabled={isSubmitting}
                        aria-invalid={errors.name ? true : undefined}
                      />
                      {errors.name && <p className="tv-form-error">{errors.name}</p>}
                    </div>

                    <div className="tv-field">
                      <label htmlFor="email" className="tv-label">
                        Email<span className="tv-label-req">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        inputMode="email"
                        autoComplete="email"
                        className="tv-input"
                        disabled={isSubmitting}
                        aria-invalid={errors.email ? true : undefined}
                      />
                      {errors.email && <p className="tv-form-error">{errors.email}</p>}
                    </div>

                    <div className="tv-field">
                      <label htmlFor="phone" className="tv-label">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        inputMode="tel"
                        autoComplete="tel"
                        className="tv-input"
                        disabled={isSubmitting}
                        aria-invalid={errors.phone ? true : undefined}
                      />
                      {errors.phone && <p className="tv-form-error">{errors.phone}</p>}
                    </div>

                    <div className="tv-field">
                      <label htmlFor="company" className="tv-label">
                        Company
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Your company"
                        autoComplete="organization"
                        className="tv-input"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div className="tv-field">
                      <label htmlFor="message" className="tv-label">
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="How can I help you?"
                        rows={4}
                        className="tv-textarea"
                        disabled={isSubmitting}
                        aria-invalid={errors.message ? true : undefined}
                      />
                      {errors.message && <p className="tv-form-error">{errors.message}</p>}
                      <p className="tv-mono mt-2 text-right">
                        {formData.message.length}/2000
                      </p>
                    </div>

                    {/* Honeypot field - hidden from users */}
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      style={{
                        position: 'absolute',
                        left: '-9999px',
                        top: '-9999px',
                      }}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div className="tv-modal-foot">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-[18px] h-[18px] animate-spin" aria-hidden="true" />
                          Sending…
                        </>
                      ) : (
                        <>
                          Send message
                          <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                        </>
                      )}
                    </button>

                    <p className="tv-small mt-4 text-center">
                      Your information will only be shared with the card owner.
                    </p>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
