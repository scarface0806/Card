'use client';

import { ADDRESS, PHONE_DISPLAY, PHONE_E164, SUPPORT_EMAIL } from '@/lib/site-config';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, Clock, MessageSquare, ArrowRight } from 'lucide-react';
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

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      description: 'We reply within 24 hours',
      value: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
      color: 'bg-primary',
    },
    {
      icon: Phone,
      title: 'Phone',
      description: 'Available 24/7',
      value: PHONE_DISPLAY,
      href: `tel:${PHONE_E164}`,
      color: 'bg-secondary',
    },
    {
      icon: MapPin,
      title: 'Office',
      description: 'Visit us anytime',
      value: ADDRESS.full,
      href: `https://maps.google.com/?q=${encodeURIComponent(ADDRESS.full)}`,
      color: 'bg-cyan-700',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8 },
    },
  };

  return (
    <>
      <Navbar />
      <main className="bg-gradient-to-br from-[#f8fafb] via-[#eef5f3] to-[#ffffff] min-h-screen">
        {/* Hero */}
        <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-72 h-72 bg-secondary/15 rounded-full blur-3xl" />
          </div>

          <div className="site-container">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="text-center mb-12"
            >
              <motion.div variants={itemVariants} className="mb-8">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm font-semibold text-primary">
                  We're Here to Help
                </span>
              </motion.div>

              <motion.h1 variants={itemVariants} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-[#0f2e25] font-space-grotesk tracking-tight">
                Get in{' '}
                <span className="text-primary">
                  Touch
                </span>
              </motion.h1>

              <motion.p variants={itemVariants} className="text-base md:text-lg text-slate-500 max-w-3xl mx-auto leading-relaxed">
                Have questions? Our friendly team is always ready to help. Reach out to us anytime.
              </motion.p>
            </motion.div>

            {/* Contact Methods */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="grid md:grid-cols-3 gap-8"
            >
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="p-8 rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f172a] to-[#020617] shadow-md hover:shadow-[0_0_30px_rgba(74,222,128,0.1)] transition-all text-center group"
                  >
                    <div className={`w-16 h-16 mx-auto rounded-xl ${method.color} mb-6 flex items-center justify-center transition-transform duration-220`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-[#0f2e25] font-space-grotesk">{method.title}</h3>
                    <p className="text-sm text-[#6b7f78] mb-4">{method.description}</p>
                    {/* Email / phone / address are actionable, not just text. */}
                    <a
                      href={method.href}
                      {...(method.href.startsWith('http')
                        ? { target: '_blank', rel: 'noopener noreferrer' }
                        : {})}
                      className="inline-flex min-h-[44px] items-center justify-center text-lg font-semibold text-primary underline-offset-4 hover:underline focus-visible:underline"
                    >
                      {method.value}
                    </a>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="relative py-24 md:py-32 bg-gradient-to-b from-[#0b1220] via-[#0f1528] to-[#0a0e1a] overflow-hidden">
          {/* Radial Glow Effect */}
          <div 
            className="absolute top-1/3 left-1/3 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 40%, transparent 70%)'
            }}
          />
          <div className="site-container relative z-10">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
              {/* Form */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-[0_0_40px_rgba(34,197,94,0.08)] hover:border-white/20 hover:shadow-[0_0_50px_rgba(34,197,94,0.12)] transition-all duration-300"
              >
                {/* Background gradient on hover */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-green-500/5 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-white font-space-grotesk tracking-tight">Send us a Message</h2>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Name</label>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/40 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Phone</label>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="9999999999"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/40 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Email</label>
                      <motion.input
                        whileFocus={{ scale: 1.01 }}
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                        className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/40 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Subject</label>
                      <motion.select
                        whileFocus={{ scale: 1.01 }}
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-white focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/40 transition-all"
                      >
                        <option value="" className="bg-[#020617] text-white">Select a subject</option>
                        <option value="product" className="bg-[#020617] text-white">Product Inquiry</option>
                        <option value="support" className="bg-[#020617] text-white">Technical Support</option>
                        <option value="billing" className="bg-[#020617] text-white">Billing Question</option>
                        <option value="partnership" className="bg-[#020617] text-white">Partnership</option>
                        <option value="other" className="bg-[#020617] text-white">Other</option>
                      </motion.select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Message</label>
                      <motion.textarea
                        whileFocus={{ scale: 1.01 }}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us how we can help..."
                        rows={5}
                        required
                        className="w-full px-4 py-3 rounded-lg bg-[#020617] border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-400 focus:ring-1 focus:ring-green-400/40 transition-all resize-none min-h-[120px]"
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isLoading}
                      type="submit"
                      className="w-full py-3 px-6 rounded-xl font-semibold text-black bg-gradient-to-r from-green-400 to-emerald-500 hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all duration-300 group flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                    >
                      {!submitted && (
                        <>
                          <Send className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                          {isLoading ? 'Sending...' : 'Send Message'}
                        </>
                      )}
                      {submitted && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center gap-2"
                        >
                          ✓ Message Sent!
                        </motion.span>
                      )}
                    </motion.button>

                    {submitError ? (
                      <p className="text-sm text-red-500/80">{submitError}</p>
                    ) : null}
                  </form>
                </div>
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="flex flex-col justify-center"
              >
                <h2 className="text-2xl md:text-3xl font-extrabold mb-10 text-white font-space-grotesk tracking-tight">Why Contact Us?</h2>

                <div className="space-y-6">
                  {[
                    {
                      icon: Clock,
                      title: 'Quick Response',
                      description: 'We aim to respond to all inquiries within 24 hours',
                    },
                    {
                      icon: MessageSquare,
                      title: 'Expert Support',
                      description: 'Our team has deep expertise in NFC technology and digital cards',
                    },
                    {
                      icon: Mail,
                      title: 'Multiple Channels',
                      description: 'Reach us via email, phone, or visit our office in person',
                    },
                  ].map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className="flex gap-4 items-start group"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors duration-300">
                            <Icon className="w-5 h-5 text-green-400" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                          <p className="text-gray-400 text-sm">{item.description}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Stats */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="mt-12 p-8 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_30px_rgba(34,197,94,0.1)] hover:border-white/20 transition-all duration-300"
                >
                  <div className="text-center">
                    <p className="text-5xl font-extrabold text-green-400 mb-2">98%</p>
                    <p className="text-sm text-gray-400">Customer Satisfaction Rate</p>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-24">
          <div className="site-container">
            <motion.div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-6 text-[#0f2e25] font-space-grotesk tracking-tight">Frequently Asked Questions</h2>
              <p className="text-base md:text-lg text-slate-500">Find answers to common questions</p>
            </motion.div>

            <div className="space-y-4">
              {[
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
              ].map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f172a] to-[#020617] shadow-sm hover:border-white/20 hover:shadow-[0_0_20px_rgba(74,222,128,0.1)] transition-all"
                >
                  <h3 className="font-semibold text-lg text-[#0f2e25] mb-2">{faq.q}</h3>
                  <p className="text-sm md:text-base text-slate-500">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
