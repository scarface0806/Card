'use client';

import { motion } from 'framer-motion';

const SIMPLE_ICONS_CDN = 'https://cdn.simpleicons.org';

// Curated core tech stack - no duplicates, clean and minimal
const techStack = [
  { name: 'React', logo: `${SIMPLE_ICONS_CDN}/react/FFFFFF` },
  { name: 'Next.js', logo: `${SIMPLE_ICONS_CDN}/nextdotjs/FFFFFF` },
  { name: 'Node.js', logo: `${SIMPLE_ICONS_CDN}/nodedotjs/FFFFFF` },
  { name: 'Tailwind CSS', logo: `${SIMPLE_ICONS_CDN}/tailwindcss/FFFFFF` },
  { name: 'Figma', logo: `${SIMPLE_ICONS_CDN}/figma/FFFFFF` },
  { name: 'HTML5', logo: `${SIMPLE_ICONS_CDN}/html5/FFFFFF` },
  // Simple Icons retired the `css3` slug; it is `css` now. The old URL had
  // been 404ing, so this logo was rendering as a broken image.
  { name: 'CSS', logo: `${SIMPLE_ICONS_CDN}/css/FFFFFF` },
];

interface TechLogoProps {
  name: string;
  logo: string;
}

function TechLogo({ name, logo }: TechLogoProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.08, y: -4 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex items-center justify-center cursor-default group"
    >
      {/* Logo Container */}
      <div className="w-16 h-16 flex items-center justify-center bg-[#232E2A] border border-[#F1F3F1]/10 rounded-xl transition-all duration-300 group-hover:border-[#C9A961]/50">
        <img
          src={logo}
          alt={name}
          width={44}
          height={44}
          className="w-11 h-11 object-contain opacity-90 group-hover:opacity-100 transition-all duration-300"
          loading="lazy"
        />
      </div>
    </motion.div>
  );
}

export default function TechStackSection() {
  return (
    <section className="tv-surface-graphite tv-section-tight overflow-hidden relative">
      <div className="site-container relative z-10">
        {/* Section Header. Left-aligned, single-weight heading - the
            "white words + one accent word" split is retired. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mb-10 md:mb-12"
        >
          <p className="tv-eyebrow mb-6">Stack</p>
          <h2 className="tv-h2 mb-4">What we build on.</h2>
          <p className="tv-lead tv-measure-body">
            Technologies powering our digital solutions.
          </p>
        </motion.div>

        {/* Tech Stack Grid - Clean Single Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap gap-4 md:gap-5"
        >
          {techStack.map((tech, idx) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.05 }}
            >
              <TechLogo {...tech} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

