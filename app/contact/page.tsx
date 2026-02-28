'use client';

import { useForm } from 'react-hook-form';
import Link from 'next/link';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageCircle, MapPin, Send, ArrowRight } from 'lucide-react';
import { SUPPORT_EMAIL, SUPPORT_PHONE, WHATSAPP_NUMBER } from '@/utils/constants';
import { validation } from '@/utils/validators';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>();

  const onSubmit = async (data: ContactFormData) => {
    alert('Thank you! We will get back to you soon.');
    reset();
  };

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email',
      description: 'Get in touch via email',
      value: SUPPORT_EMAIL,
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    {
      icon: Phone,
      title: 'Phone',
      description: 'Call us during business hours',
      value: SUPPORT_PHONE,
      href: `tel:${SUPPORT_PHONE}`,
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      description: 'Chat with us on WhatsApp',
      value: 'Chat Now',
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 min-h-screen bg-gradient-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff]">
        <div className="site-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 border border-teal-200 rounded-full mb-6">
              <Send className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">Get in Touch</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
              Contact{' '}
              <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
                Us
              </span>
            </h1>
            <p className="text-lg text-[#4b635d] max-w-2xl mx-auto">
              Have questions? We're here to help. Reach out anytime.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {/* Contact Methods */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-1 space-y-6"
            >
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <motion.div key={index} variants={itemVariants}>
                    <a href={method.href} target="_blank" rel="noopener noreferrer">
                      <motion.div
                        whileHover={{ y: -4 }}
                        className="p-6 bg-white rounded-2xl border border-teal-100 shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <div className="bg-teal-50 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                          <Icon className="w-6 h-6 text-teal-600" />
                        </div>
                        <h3 className="font-bold text-[#0f2e25] font-space-grotesk">{method.title}</h3>
                        <p className="text-sm text-[#6b7f78] mb-3">
                          {method.description}
                        </p>
                        <p className="font-semibold text-teal-600 text-sm flex items-center gap-1">
                          {method.value}
                          <ArrowRight className="w-4 h-4" />
                        </p>
                      </motion.div>
                    </a>
                  </motion.div>
                );
              })}

              {/* Location */}
              <motion.div variants={itemVariants}>
                <div className="p-6 bg-white rounded-2xl border border-teal-100 shadow-md">
                  <div className="bg-teal-50 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                    <MapPin className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="font-bold text-[#0f2e25] font-space-grotesk">Office</h3>
                  <p className="text-sm text-[#4b635d] mt-2">
                    New Delhi, India
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-white rounded-2xl border border-teal-100 shadow-md p-8">
                <h3 className="text-2xl font-bold text-[#0f2e25] font-space-grotesk mb-6">
                  Send us a Message
                </h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Full Name *"
                      placeholder="John Doe"
                      {...register('name', validation.name)}
                      error={errors.name?.message as string}
                    />
                    <Input
                      label="Email *"
                      placeholder="you@example.com"
                      type="email"
                      {...register('email', validation.email)}
                      error={errors.email?.message as string}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Phone *"
                      placeholder="9999999999"
                      type="tel"
                      {...register('phone', validation.phone)}
                      error={errors.phone?.message as string}
                    />
                    <Input
                      label="Subject *"
                      placeholder="How can we help?"
                      {...register('subject', {
                        required: 'Subject is required',
                      })}
                      error={errors.subject?.message as string}
                    />
                  </div>

                  <TextArea
                    label="Message *"
                    placeholder="Tell us what you would like to discuss..."
                    rows={6}
                    {...register('message', {
                      required: 'Message is required',
                      minLength: {
                        value: 10,
                        message: 'Message must be at least 10 characters',
                      },
                    })}
                    error={errors.message?.message as string}
                  />

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-teal-600 text-white hover:bg-teal-700 rounded-xl font-semibold transition-all duration-300"
                  >
                    Send Message
                    <Send className="w-4 h-4" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </div>

          {/* Map Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="bg-white rounded-2xl border border-teal-100 shadow-md overflow-hidden">
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 pt-[40%] flex items-center justify-center text-[#6b7f78]">
                <span>Map Location - New Delhi, India</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
