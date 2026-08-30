'use client';

import { ADDRESS, PHONE_DISPLAY, PHONE_E164, SUPPORT_EMAIL } from '@/lib/site-config';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, MessageSquare, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to submit message');
      }

      setSubmitted(true);
      setTimeout(() => {
        setFormData({ name: '', phone: '', email: '', subject: '', message: '' });
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to submit message');
    } finally {
      setIsLoading(false);
    }
  };

  // The `color` field is gone: three unrelated swatches (primary, secondary,
  // cyan-700) on three otherwise identical tiles read as decoration.
  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      description: 'We reply within 24 hours',
      value: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    {
      icon: Phone,
      title: 'Phone',
      description: 'Available 24/7',
      value: PHONE_DISPLAY,
      href: `tel:${PHONE_E164}`,
    },
    {
      icon: MapPin,
      title: 'Office',
      description: 'Visit us anytime',
      value: ADDRESS.full,
      href: `https://maps.google.com/?q=${encodeURIComponent(ADDRESS.full)}`,
    },
  ];

  const reasons = [
    {
      icon: Clock,
      title: 'Quick response',
      description: 'We aim to respond to all inquiries within 24 hours',
    },
    {
      icon: MessageSquare,
      title: 'Expert support',
      description: 'Our team has deep expertise in NFC technology and digital cards',
    },
    {
      icon: Mail,
      title: 'Multiple channels',
      description: 'Reach us via email, phone, or visit our office in person',
    },
  ];

  const faqs = [
    {
      q: 'What is the typical response time?',
      a: 'We respond to all inquiries within 24 hours during business days. Urgent support requests get priority.',
    },
    {
      q: 'Do you provide customer support outside business hours?',
      a: 'Yes, our Enterprise plan includes 24/7 dedicated support. Basic plans have support available Monday-Friday.',
    },
    {
      q: 'How can I report a bug or issue?',
      a: 'You can report issues directly through our support form above, or email support@tapvyo.com with detailed information.',
    },
    {
      q: 'Do you offer custom enterprise solutions?',
      a: 'Absolutely! Contact our team to discuss white-label, API, or custom integration requirements.',
    },
  ];

  return (
    <>
      <Navbar />
      <main>
        {/* HERO + contact channels on ink. */}
        <section className="tv-hero tv-page-head">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end mb-14 md:mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-7"
              >
                <p className="tv-eyebrow mb-7">Contact</p>
                <h1 className="tv-display" style={{ maxWidth: '13ch' }}>
                  Talk to a person, not a form.
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="lg:col-span-5 lg:pb-3"
              >
                <p className="tv-lead">
                  Have questions? Our team is always ready to help. Reach out anytime.
                </p>
              </motion.div>
            </div>

            {/* Contact channels. Each value stays a real mailto:/tel:/maps link. */}
            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6"
            >
              {contactMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <li key={method.title} className="tv-panel tv-panel-pad">
                    <Icon
                      className="w-5 h-5 mb-5 text-[#C9A961]"
                      strokeWidth={1.6}
                      aria-hidden="true"
                    />
                    <h2 className="tv-mono mb-2">{method.title}</h2>
                    <a
                      href={method.href}
                      {...(method.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="tv-h4 tv-focus inline-flex min-h-[44px] items-center hover:text-[#4CAE89] transition-colors"
                    >
                      {method.value}
                    </a>
                    <p className="tv-small mt-1">{method.description}</p>
                  </li>
                );
              })}
            </motion.ul>
          </div>
        </section>

        {/* FORM on paper — the page's primary task gets the light surface. */}
        <section className="tv-surface-bone tv-section">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              {/* Form */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-7"
              >
                <p className="tv-eyebrow mb-6">Send a message</p>
                <h2 className="tv-h2 mb-8">Tell us what you need.</h2>

                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                    <div className="tv-field">
                      <label htmlFor="contact-name" className="tv-label">
                        Name
                      </label>
                      <input
                        type="text"
                        id="contact-name"
                        name="name"
                        autoComplete="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                        className="tv-input"
                      />
                    </div>

                    <div className="tv-field">
                      <label htmlFor="contact-phone" className="tv-label">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="contact-phone"
                        name="phone"
                        inputMode="tel"
                        autoComplete="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="9876543210"
                        required
                        className="tv-input"
                      />
                    </div>
                  </div>

                  <div className="tv-field">
                    <label htmlFor="contact-email" className="tv-label">
                      Email
                    </label>
                    <input
                      type="email"
                      id="contact-email"
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

                  <div className="tv-field">
                    <label htmlFor="contact-subject" className="tv-label">
                      Subject
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="tv-select"
                    >
                      <option value="">Select a subject</option>
                      <option value="product">Product Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="billing">Billing Question</option>
                      <option value="partnership">Partnership</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="tv-field">
                    <label htmlFor="contact-message" className="tv-label">
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help..."
                      rows={5}
                      required
                      className="tv-textarea"
                    />
                  </div>

                  <div className="mt-7">
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ y: 0 }}
                      disabled={isLoading}
                      type="submit"
                      className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitted ? 'Message sent' : isLoading ? 'Sending…' : 'Send message'}
                      {!submitted && !isLoading && (
                        <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                      )}
                    </motion.button>

                    {/* Status is announced, not just coloured. */}
                    <p className="sr-only" role="status" aria-live="polite">
                      {submitted ? 'Your message has been sent.' : isLoading ? 'Sending your message.' : ''}
                    </p>

                    {submitError ? (
                      <p className="tv-form-error mt-3" role="alert">
                        {submitError}
                      </p>
                    ) : null}
                  </div>
                </form>
              </motion.div>

              {/* Why contact us */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-5"
              >
                <div className="lg:sticky lg:top-32">
                  <h2 className="tv-h3 mb-7">What to expect</h2>

                  <ul className="mb-10">
                    {reasons.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li
                          key={item.title}
                          className="flex gap-4 items-start py-4 border-b border-[#12100C]/12 last:border-b-0"
                        >
                          <Icon
                            className="w-5 h-5 mt-0.5 shrink-0 text-[#6E5518]"
                            strokeWidth={1.6}
                            aria-hidden="true"
                          />
                          <div>
                            <h3 className="tv-h4 mb-1">{item.title}</h3>
                            <p className="tv-small">{item.description}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="border-t border-[#6E5518]/35 pt-6">
                    <p
                      className="text-4xl font-semibold text-[#12100C]"
                      style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
                    >
                      98%
                    </p>
                    <p className="tv-small mt-1">Customer Satisfaction Rate</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="tv-surface-graphite tv-section">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-4"
              >
                <p className="tv-eyebrow mb-6">Questions</p>
                <h2 className="tv-h2">Common questions.</h2>
              </motion.div>

              <div className="lg:col-span-8">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={faq.q}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5, delay: index * 0.06 }}
                    className="py-6 border-b border-[#F1F3F1]/10 first:pt-0"
                  >
                    <h3 className="tv-h4 mb-2">{faq.q}</h3>
                    <p className="tv-body" style={{ maxWidth: '68ch' }}>
                      {faq.a}
                    </p>
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
