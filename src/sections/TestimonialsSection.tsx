'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { PlayCircle } from 'lucide-react';
import { TESTIMONIALS, type Testimonial } from '@/lib/site-config';

/**
 * Customer testimonials, driven by TESTIMONIALS in site-config.ts.
 *
 * The section renders NOTHING while that list is empty. It used to carry three
 * invented quotes ("Rajesh Kumar, Entrepreneur at Tech Startup" and two more)
 * with five-star ratings; a made-up testimonial does more damage to trust than
 * no testimonial, so only real, permitted quotes go in the config.
 *
 * No star rating is shown: there is no rating field to source one from.
 */
export default function TestimonialsSection({
  testimonials = TESTIMONIALS,
}: {
  testimonials?: Testimonial[];
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prefersReducedMotion = useReducedMotion();
  const count = testimonials.length;

  useEffect(() => {
    // Do not auto-advance for anyone who asked the OS for reduced motion -
    // the dots still let them move through at their own pace.
    if (prefersReducedMotion || count < 2) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, 5000);
    return () => clearInterval(timer);
  }, [prefersReducedMotion, count]);

  if (count === 0) return null;

  const current = testimonials[currentIndex % count];
  const byline = [current.role, current.city].filter(Boolean).join(' · ');

  return (
    <section className="tv-surface-ink tv-section-tight">
      <div className="site-container">
        {/* No panel, no quote badge, no centred badge pill. The quote is set
            large in the display face and carries the section on its own. */}
        <div className="max-w-4xl mx-auto text-center">
          <p className="tv-eyebrow tv-eyebrow--center mb-10">Customers</p>

          <motion.blockquote
            key={currentIndex}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="tv-h2 mb-8">&ldquo;{current.quote}&rdquo;</p>

            <footer className="flex flex-col items-center gap-2">
              {current.photoUrl && (
                // Plain <img>: the URL is whatever the owner pastes into the
                // config, and next/image would reject any host not listed in
                // next.config.ts remotePatterns.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={current.photoUrl}
                  alt=""
                  width={56}
                  height={56}
                  loading="lazy"
                  className="mb-2 h-14 w-14 rounded-full object-cover border border-[#C9A961]/40"
                />
              )}
              <p className="tv-h4">{current.name}</p>
              {byline && <p className="tv-mono">{byline}</p>}
              {current.videoUrl && (
                <a
                  href={current.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tv-btn-tertiary mt-2 inline-flex items-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" aria-hidden="true" />
                  Watch {current.name.split(' ')[0]}&apos;s video
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              )}
            </footer>
          </motion.blockquote>

          {/* Dots - only when there is more than one quote to move between. */}
          {count > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {testimonials.map((testimonial, index) => (
                <button
                  key={`${testimonial.name}-${index}`}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Show testimonial ${index + 1} of ${count}`}
                  aria-current={index === currentIndex % count}
                  // The dot itself stays 8px tall; the button around it is a full
                  // 44px tap target with the padding clipped out of the layout.
                  className="group tv-focus -my-5 flex min-w-[24px] justify-center py-5"
                >
                  <span
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      index === currentIndex % count
                        ? 'bg-[#C9A961] w-8'
                        : 'bg-[#F1F3F1]/25 w-1.5 group-hover:bg-[#F1F3F1]/60'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
