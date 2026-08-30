'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Star } from 'lucide-react';

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

  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Do not auto-advance for anyone who asked the OS for reduced motion -
    // the dots still let them move through at their own pace.
    if (prefersReducedMotion) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [prefersReducedMotion]);

  const current = testimonials[currentIndex];

  return (
    <section className="tv-surface-ink tv-section-tight">
      <div className="site-container">
        {/* No panel, no quote badge, no centred badge pill. The quote is set
            large in the display face and carries the section on its own. */}
        <div className="max-w-4xl mx-auto text-center">
          <p className="tv-eyebrow tv-eyebrow--center mb-10">Customers</p>

          <motion.blockquote
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="tv-h2 mb-8">&ldquo;{current.text}&rdquo;</p>

            <footer className="flex flex-col items-center gap-2">
              <span className="flex gap-0.5" aria-label={`Rated ${current.rating} out of 5`}>
                {[...Array(current.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C9A961] text-[#C9A961]" aria-hidden="true" />
                ))}
              </span>
              <p className="tv-h4">{current.name}</p>
              <p className="tv-mono">
                {current.role} at {current.company}
              </p>
            </footer>
          </motion.blockquote>

          {/* Dots */}
          <div className="flex justify-center gap-2 mt-10">
            {testimonials.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Show testimonial ${index + 1} of ${testimonials.length}`}
                aria-current={index === currentIndex}
                // The dot itself stays 8px tall; the button around it is a full
                // 44px tap target with the padding clipped out of the layout.
                className="group tv-focus -my-5 flex min-w-[24px] justify-center py-5"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-[#C9A961] w-8'
                      : 'bg-[#F1F3F1]/25 w-1.5 group-hover:bg-[#F1F3F1]/60'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
