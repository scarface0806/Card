'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

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
    <section className="py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto max-w-6xl px-6 sm:px-8 md:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-14"
        >
          {/* Small Label */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-teal-200 rounded-full mb-6">
            <span className="text-sm font-medium text-teal-700">Testimonials</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0f2e25] font-space-grotesk mb-4">
            What Customers{' '}
            <span className="bg-gradient-to-r from-teal-600 to-emerald-500 bg-clip-text text-transparent">
              Say
            </span>
          </h2>
          <p className="text-base md:text-lg text-[#4b635d]">
            Join thousands of satisfied users
          </p>
        </motion.div>

        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl p-8 md:p-12 border border-teal-100 shadow-lg text-center relative"
        >
          {/* Quote Icon */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-teal-600 rounded-full flex items-center justify-center">
            <Quote className="w-6 h-6 text-white" />
          </div>

          <div className="flex justify-center gap-1 mb-6 mt-4">
            {[...Array(current.rating)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>

          <blockquote className="text-2xl md:text-3xl font-semibold text-[#0f2e25] mb-6 leading-relaxed font-space-grotesk">
            &ldquo;{current.text}&rdquo;
          </blockquote>

          <div>
            <p className="font-bold text-[#0f2e25] text-lg">{current.name}</p>
            <p className="text-[#6b7f78]">
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
                  ? 'bg-teal-600 w-8' 
                  : 'bg-teal-200 w-2 hover:bg-teal-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
