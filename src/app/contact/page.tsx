'use client';

import { useForm } from 'react-hook-form';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import TextArea from '@/components/TextArea';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MessageCircle,
  MapPin,
} from 'lucide-react';
import {
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  WHATSAPP_NUMBER,
} from '@/utils/constants';
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
    // Mock submission
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
      <main className="pt-32 pb-20 min-h-screen bg-gray-50">
        <div className="site-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
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
                  <motion.div
                    key={index}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                  >
                    <a href={method.href} target="_blank" rel="noopener noreferrer">
                      <Card hover>
                        <div className="p-6 space-y-4">
                          <div className="bg-blue-50 rounded-lg w-12 h-12 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-black">{method.title}</h3>
                            <p className="text-sm text-gray-500 mb-3">
                              {method.description}
                            </p>
                            <p className="font-semibold text-blue-600 text-sm">
                              {method.value} →
                            </p>
                          </div>
                        </div>
                      </Card>
                    </a>
                  </motion.div>
                );
              })}

              {/* Location */}
              <motion.div variants={itemVariants}>
                <Card>
                  <div className="p-6 space-y-4">
                    <div className="bg-blue-50 rounded-lg w-12 h-12 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-black">Office</h3>
                      <p className="text-sm text-gray-600 mt-2">
                        New Delhi, India
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-black mb-6">
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
                      placeholder="Tell us what you'd like to discuss..."
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

                    <Button
                      type="submit"
                      variant="secondary"
                      size="lg"
                      className="w-full"
                    >
                      Send Message
                    </Button>
                  </form>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Map Placeholder */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card>
              <div className="bg-gradient-to-br from-gray-300 to-gray-400 rounded-t-2xl pt-[40%] flex items-center justify-center text-gray-600">
                <span>Map Location - New Delhi, India</span>
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
