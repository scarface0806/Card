'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, Quote, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  text: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    role: 'Entrepreneur',
    company: 'Tech Startup',
    text: 'Tapvyo revolutionized how I share my contact information. My clients love the convenience!',
    rating: 5,
  },
  {
    id: 2,
    name: 'Priya Sharma',
    role: 'Sales Manager',
    company: 'Global Corp',
    text: 'The analytics dashboard helps me track every connection. Absolutely recommend it!',
    rating: 5,
  },
  {
    id: 3,
    name: 'Amit Patel',
    role: 'Consultant',
    company: 'Business Solutions',
    text: 'Professional, elegant, and incredibly user-friendly. Worth every rupee!',
    rating: 5,
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const current = testimonials[currentIndex];

  return (
    <section className="section-spacing section-teal-soft">
      <div className="site-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="section-header"
        >
          {/* Small Label */}
          <div className="section-badge">
            <span>Testimonials</span>
          </div>
          
          <h2 className="heading-1 section-title font-space-grotesk">
            What Customers{' '}
            <span className="text-gradient">
              Say
            </span>
          </h2>
          <p className="text-sm md:text-base text-slate-500 section-subtitle">
            Join thousands of satisfied users
          </p>
        </motion.div>

        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card card-padding md:p-12 lg:p-16 text-center relative bg-white shadow-lg max-w-3xl mx-auto"
        >
          {/* Quote Icon */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 md:w-14 md:h-14 bg-primary rounded-full flex items-center justify-center">
            <Quote className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>

          <div className="flex justify-center gap-1 mb-6 mt-4">
            {[...Array(current.rating)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>

          <blockquote className="heading-3 text-[#0f2e25] mb-6 leading-relaxed font-space-grotesk">
            &ldquo;{current.text}&rdquo;
          </blockquote>

          <div>
            <p className="font-bold text-[#0f2e25] text-lg">{current.name}</p>
            <p className="body-base text-[#6b7f78]">
              {current.role} at {current.company}
            </p>
          </div>
        </motion.div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-primary w-8' 
                  : 'bg-primary/15 w-2 hover:bg-primary/90'
              }`}
            />
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-12"
        >
          <Link href={ROUTES.CREATE_CARD}>
            <motion.button
              whileHover={{ y: -3 }}
              whileTap={{ y: 1 }}
              className="btn btn-lg btn-primary"
            >
              Join Thousands of Happy Users
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
