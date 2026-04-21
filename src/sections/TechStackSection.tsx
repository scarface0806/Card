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
  { name: 'CSS3', logo: `${SIMPLE_ICONS_CDN}/css3/FFFFFF` },
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
      {/* Logo Container - Dark Premium Style */}
      <div className="w-16 h-16 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl shadow-md transition-all duration-300 group-hover:scale-105 group-hover:border-green-400 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.2)]">
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
    <section className="section bg-gradient-to-b from-[#0b1220] via-[#0f1528] to-[#0a0e1a] overflow-hidden relative">
      {/* Subtle gradient glow background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="site-container relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-space-grotesk mb-4 tracking-tight">
            <span className="text-white">Our Technology</span>
            {' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              Stack
            </span>
          </h2>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto">
            Technologies powering our digital solutions.
          </p>
        </motion.div>

        {/* Tech Stack Grid - Clean Single Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto"
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

