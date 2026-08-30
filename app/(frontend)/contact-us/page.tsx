'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ADDRESS, PHONE_DISPLAY, PHONE_E164, SUPPORT_EMAIL } from '@/lib/site-config';
import { contactFormSchema, type ContactFormValues } from '@/lib/validations/contactFormSchema';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, MessageSquare, ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

const sanitizeName = (value: string) => value.replace(/[^A-Za-z\s.'-]/g, '').replace(/\s+/g, ' ').trim();
const sanitizePhone = (value: string) => value.replace(/\D+/g, '').slice(0, 10);
const sanitizeEmail = (value: string) => value.replace(/\s+/g, '').toLowerCase();

export default function ContactUsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const firstInvalidRef = useRef<HTMLElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      subject: '',
      message: '',
      website: '',
    },
  });

  const messageValue = watch('message', '');

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0] as keyof ContactFormValues;
      const fieldMap: Record<string, string> = {
        name: 'contact-name',
        phone: 'contact-phone',
        email: 'contact-email',
        subject: 'contact-subject',
        message: 'contact-message',
      };
      const id = fieldMap[firstErrorField];
      const node = id ? document.getElementById(id) : null;
      if (node && node instanceof HTMLElement) {
        firstInvalidRef.current = node;
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        node.focus();
      }
    }
  }, [errors]);

  const onValidSubmit = async (data: ContactFormValues) => {
    setIsLoading(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email,
          subject: data.subject,
          message: data.message,
          website: data.website,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || payload.message || 'Failed to submit message');
      }

      setSubmitted(true);
      reset();
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const char = event.key;
    if (/[0-9@#$%^&*()_=+\/\\<>]/.test(char)) {
      event.preventDefault();
    }
  };

  const handlePhoneKeydown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const forbidden = /[A-Za-z\s+\-.,eE]/;
    if (forbidden.test(event.key) || event.key === ' ') {
      event.preventDefault();
    }
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

  const handleMessagePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const value = event.clipboardData.getData('text');
    const safe = value.replace(/https?:\/\/[^\s]+/gi, '');
    event.preventDefault();
    const text = (watch('message') || '') + safe;
    setValue('message', text, { shouldValidate: true, shouldDirty: true });
  };

  // The `color` field is gone: three unrelated swatches (primary, secondary,
  // cyan-700) on three otherwise identical tiles read as decoration.
  const contactMethods = [
    { icon: Mail, title: 'Email', description: 'We reply within 24 hours', value: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}` },
    { icon: Phone, title: 'Phone', description: 'Available 24/7', value: PHONE_DISPLAY, href: `tel:${PHONE_E164}` },
    { icon: MapPin, title: 'Office', description: 'Visit us anytime', value: ADDRESS.full, href: `https://maps.google.com/?q=${encodeURIComponent(ADDRESS.full)}` },
  ];

  const reasons = [
    { icon: Clock, title: 'Quick response', description: 'We aim to respond to all inquiries within 24 hours' },
    { icon: MessageSquare, title: 'Expert support', description: 'Our team has deep expertise in NFC technology and digital cards' },
    { icon: Mail, title: 'Multiple channels', description: 'Reach us via email, phone, or visit our office in person' },
  ];

  const faqs = [
    { q: 'What is the typical response time?', a: 'We respond to all inquiries within 24 hours during business days. Urgent support requests get priority.' },
    { q: 'Do you provide customer support outside business hours?', a: 'Yes, our Enterprise plan includes 24/7 dedicated support. Basic plans have support available Monday-Friday.' },
    { q: 'How can I report a bug or issue?', a: 'You can report issues directly through our support form above, or email support@tapvyo.com with detailed information.' },
    { q: 'Do you offer custom enterprise solutions?', a: 'Absolutely! Contact our team to discuss white-label, API, or custom integration requirements.' },
  ];

  return (
    <>
      <Navbar />
      <main>
        <section className="tv-hero tv-page-head">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end mb-14 md:mb-16">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="lg:col-span-7">
                <p className="tv-eyebrow mb-7">Contact</p>
                <h1 className="tv-display" style={{ maxWidth: '13ch' }}>Talk to a person, not a form.</h1>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="lg:col-span-5 lg:pb-3">
                <p className="tv-lead">Have questions? Our team is always ready to help. Reach out anytime.</p>
              </motion.div>
            </div>

            <motion.ul initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
              {contactMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <li key={method.title} className="tv-panel tv-panel-pad">
                    <Icon className="w-5 h-5 mb-5 text-[#C9A961]" strokeWidth={1.6} aria-hidden="true" />
                    <h2 className="tv-mono mb-2">{method.title}</h2>
                    <a href={method.href} {...(method.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="tv-h4 tv-focus inline-flex min-h-[44px] items-center hover:text-[#4CAE89] transition-colors">
                      {method.value}
                    </a>
                    <p className="tv-small mt-1">{method.description}</p>
                  </li>
                );
              })}
            </motion.ul>
          </div>
        </section>

        <section className="tv-surface-bone tv-section">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-7">
                <p className="tv-eyebrow mb-6">Send a message</p>
                <h2 className="tv-h2 mb-8">Tell us what you need.</h2>

                <form onSubmit={handleSubmit(onValidSubmit)} noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                    <div className="tv-field">
                      <label htmlFor="contact-name" className="tv-label">Name</label>
                      <input
                        type="text"
                        id="contact-name"
                        autoComplete="name"
                        placeholder="Your name"
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'contact-name-error' : undefined}
                        className={`tv-input ${errors.name ? '!border-[#FF8A80]' : ''}`}
                        {...register('name', {
                          onChange: (event) => {
                            const sanitized = sanitizeName(event.target.value);
                            if (sanitized !== event.target.value) event.target.value = sanitized;
                          },
                          onBlur: () => trigger('name'),
                        })}
                        onKeyDown={handleNameKeydown}
                        onPaste={(event) => {
                          const text = event.clipboardData.getData('text');
                          const safe = sanitizeName(text);
                          event.preventDefault();
                          const next = sanitizeName((watch('name') || '') + safe);
                          setValue('name', next, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                      {errors.name && <p id="contact-name-error" role="alert" className="tv-form-error mt-1.5">{errors.name.message}</p>}
                    </div>

                    <div className="tv-field">
                      <label htmlFor="contact-phone" className="tv-label">Phone</label>
                      <input
                        type="tel"
                        id="contact-phone"
                        inputMode="numeric"
                        autoComplete="tel"
                        maxLength={10}
                        placeholder="9876543210"
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
                        className={`tv-input ${errors.phone ? '!border-[#FF8A80]' : ''}`}
                        {...register('phone', {
                          onChange: (event) => {
                            const digits = sanitizePhone(event.target.value);
                            if (digits !== event.target.value) event.target.value = digits;
                          },
                          onBlur: () => trigger('phone'),
                        })}
                        onKeyDown={handlePhoneKeydown}
                        onPaste={(event) => {
                          event.preventDefault();
                          const digits = sanitizePhone(event.clipboardData.getData('text'));
                          setValue('phone', digits, { shouldValidate: true, shouldDirty: true });
                        }}
                      />
                      {errors.phone && <p id="contact-phone-error" role="alert" className="tv-form-error mt-1.5">{errors.phone.message}</p>}
                    </div>
                  </div>

                  <div className="tv-field">
                    <label htmlFor="contact-email" className="tv-label">Email</label>
                    <input
                      type="email"
                      id="contact-email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="your@email.com"
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'contact-email-error' : undefined}
                      className={`tv-input ${errors.email ? '!border-[#FF8A80]' : ''}`}
                      {...register('email', {
                        setValueAs: (value) => sanitizeEmail(String(value ?? '')),
                        onBlur: () => trigger('email'),
                      })}
                      onPaste={(event) => {
                        event.preventDefault();
                        const cleaned = sanitizeEmail(event.clipboardData.getData('text'));
                        setValue('email', cleaned, { shouldValidate: true, shouldDirty: true });
                      }}
                    />
                    {errors.email && <p id="contact-email-error" role="alert" className="tv-form-error mt-1.5">{errors.email.message}</p>}
                  </div>

                  <div className="tv-field">
                    <label htmlFor="contact-subject" className="tv-label">Subject</label>
                    <select
                      id="contact-subject"
                      aria-invalid={!!errors.subject}
                      aria-describedby={errors.subject ? 'contact-subject-error' : undefined}
                      className={`tv-select ${errors.subject ? '!border-[#FF8A80]' : ''}`}
                      {...register('subject', { onBlur: () => trigger('subject') })}
                    >
                      <option value="">Select a subject</option>
                      <option value="product">Product Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.subject && <p id="contact-subject-error" role="alert" className="tv-form-error mt-1.5">{errors.subject.message}</p>}
                  </div>

                  <div className="tv-field">
                    <label htmlFor="contact-message" className="tv-label">Message</label>
                    <textarea
                      id="contact-message"
                      rows={5}
                      placeholder="Tell us how we can help..."
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? 'contact-message-error' : undefined}
                      className={`tv-textarea ${errors.message ? '!border-[#FF8A80]' : ''}`}
                      {...register('message', {
                        onBlur: () => trigger('message'),
                      })}
                      onPaste={handleMessagePaste}
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="tv-small">Tell us how we can help</span>
                      <span className={`tv-small ${messageValue.length > 950 ? 'text-[#FF8A80]' : ''}`}>{messageValue.length}/1000</span>
                    </div>
                    {errors.message && <p id="contact-message-error" role="alert" className="tv-form-error mt-1.5">{errors.message.message}</p>}
                  </div>

<input
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="hidden"
                      {...register('website', {
                        setValueAs: (value) => (typeof value === 'string' ? value.trim() : ''),
                      })}
                    />

                  <div className="mt-7">
                    <motion.button whileHover={{ y: -2 }} whileTap={{ y: 0 }} disabled={isSubmitting || isLoading} type="submit" className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block disabled:opacity-50 disabled:cursor-not-allowed">
                      {submitted ? 'Message sent' : isSubmitting || isLoading ? 'Sending...' : 'Send message'}
                      {!submitted && !(isSubmitting || isLoading) && <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />}
                    </motion.button>

                    <p className="sr-only" role="status" aria-live="polite">
                      {submitted ? 'Your message has been sent.' : isSubmitting || isLoading ? 'Sending your message.' : ''}
                    </p>

                    {submitError ? <p className="tv-form-error mt-3" role="alert">{submitError}</p> : null}
                  </div>
                </form>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="lg:col-span-5">
                <div className="lg:sticky lg:top-32">
                  <h2 className="tv-h3 mb-7">What to expect</h2>

                  <ul className="mb-10">
                    {reasons.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.title} className="flex gap-4 items-start py-4 border-b border-[#12100C]/12 last:border-b-0">
                          <Icon className="w-5 h-5 mt-0.5 shrink-0 text-[#6E5518]" strokeWidth={1.6} aria-hidden="true" />
                          <div>
                            <h3 className="tv-h4 mb-1">{item.title}</h3>
                            <p className="tv-small">{item.description}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="border-t border-[#6E5518]/35 pt-6">
                    <p className="text-4xl font-semibold text-[#12100C]" style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}>98%</p>
                    <p className="tv-small mt-1">Customer Satisfaction Rate</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="tv-surface-graphite tv-section">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:col-span-4">
                <p className="tv-eyebrow mb-6">Questions</p>
                <h2 className="tv-h2">Common questions.</h2>
              </motion.div>

              <div className="lg:col-span-8">
                {faqs.map((faq, index) => (
                  <motion.div key={faq.q} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.5, delay: index * 0.06 }} className="py-6 border-b border-[#F1F3F1]/10 first:pt-0">
                    <h3 className="tv-h4 mb-2">{faq.q}</h3>
                    <p className="tv-body" style={{ maxWidth: '68ch' }}>{faq.a}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
