'use client';

import { motion } from 'framer-motion';

const DEVICON_CDN = 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons';

// Tech stack with real brand logos from devicon CDN
const techStack = [
  { name: 'Node.js', logo: `${DEVICON_CDN}/nodejs/nodejs-original.svg`, bg: 'bg-[#eef7ee]' },
  { name: 'Vue.js', logo: `${DEVICON_CDN}/vuejs/vuejs-original.svg`, bg: 'bg-[#eef8ee]' },
  { name: 'Tailwind CSS', logo: `${DEVICON_CDN}/tailwindcss/tailwindcss-original.svg`, bg: 'bg-[#ebf5fc]' },
  { name: 'Bootstrap', logo: `${DEVICON_CDN}/bootstrap/bootstrap-original.svg`, bg: 'bg-[#f0ecf8]' },
  { name: 'HTML5', logo: `${DEVICON_CDN}/html5/html5-original.svg`, bg: 'bg-[#fdeee8]' },
  { name: 'CSS3', logo: `${DEVICON_CDN}/css3/css3-original.svg`, bg: 'bg-[#e8eefb]' },
  { name: 'PHP', logo: `${DEVICON_CDN}/php/php-original.svg`, bg: 'bg-[#eeedf8]' },
  { name: 'WordPress', logo: `${DEVICON_CDN}/wordpress/wordpress-plain.svg`, bg: 'bg-[#e8edf6]' },
  { name: 'Sass', logo: `${DEVICON_CDN}/sass/sass-original.svg`, bg: 'bg-[#f8ecf2]' },
  { name: 'Framer', logo: `${DEVICON_CDN}/framermotion/framermotion-original.svg`, bg: 'bg-[#f0f0f0]' },
  { name: 'Figma', logo: `${DEVICON_CDN}/figma/figma-original.svg`, bg: 'bg-[#f2ecf5]' },
  { name: 'React', logo: `${DEVICON_CDN}/react/react-original.svg`, bg: 'bg-[#e8f4fa]' },
  { name: 'Next.js', logo: `${DEVICON_CDN}/nextjs/nextjs-original.svg`, bg: 'bg-[#f0f0f0]' },
];

// Duplicate for seamless infinite scroll
const duplicatedTech = [...techStack, ...techStack];

interface TechLogoProps {
  name: string;
  logo: string;
  bg: string;
}

function TechLogo({ name, logo, bg }: TechLogoProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      className="shrink-0 flex flex-col items-center gap-3 cursor-default group"
    >
      {/* Logo Container */}
      <div
        className={`w-14 h-14 md:w-16 md:h-16 rounded-xl ${bg} p-3 flex items-center justify-center shadow-sm group-hover:shadow-lg transition-all duration-300`}
      >
        <img
          src={logo}
          alt={name}
          width={40}
          height={40}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>

      {/* Label */}
      <span className="text-xs md:text-sm font-medium text-gray-600 group-hover:text-teal-600 transition-colors duration-300 whitespace-nowrap text-center">
        {name}
      </span>
    </motion.div>
  );
}

export default function TechStackSection() {
  return (
    <section className="section-spacing bg-gradient-to-b from-white/80 via-white to-[#f8fffe] overflow-hidden">
      <div className="site-container mb-20">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="section-header !mb-0"
        >
          <h2 className="heading-1 section-title font-space-grotesk">
            Our Technology{' '}
            <span className="text-gradient">
              Stack
            </span>
          </h2>
          <p className="body-lg section-subtitle">
            Technologies powering our digital solutions.
          </p>
        </motion.div>
      </div>

      {/* Carousels Container */}
      <div className="relative overflow-hidden">
        {/* Left Fade Mask */}
        <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-white/80 from-0% via-white/40 to-transparent z-20 pointer-events-none" />

        {/* Right Fade Mask */}
        <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-white/80 from-0% via-white/40 to-transparent z-20 pointer-events-none" />

        {/* Row 1 - Scroll Left → Right */}
        <motion.div className="mb-16 md:mb-20 overflow-hidden">
          <motion.div
            className="flex gap-12 md:gap-16 py-8"
            animate={{
              x: ['0%', '-50%'],
            }}
            transition={{
              x: {
                duration: 50,
                repeat: Infinity,
                ease: 'linear',
              },
            }}
            whileHover={{ animationPlayState: 'paused' }}
          >
            {duplicatedTech.map((tech, index) => (
              <TechLogo key={`row1-${index}`} {...tech} />
            ))}
          </motion.div>
        </motion.div>

        {/* Row 2 - Scroll Right ← Left */}
        <motion.div className="overflow-hidden">
          <motion.div
            className="flex gap-12 md:gap-16 py-8"
            animate={{
              x: ['-50%', '0%'],
            }}
            transition={{
              x: {
                duration: 55,
                repeat: Infinity,
                ease: 'linear',
              },
            }}
            whileHover={{ animationPlayState: 'paused' }}
          >
            {duplicatedTech.map((tech, index) => (
              <TechLogo key={`row2-${index}`} {...tech} />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

