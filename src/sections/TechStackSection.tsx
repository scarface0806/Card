'use client';

import { motion } from 'framer-motion';

// Tech stack with official brand logos
const techStack = [
  {
    name: 'Figma',
    svg: (
      <svg viewBox="0 0 200 300" width="100%" height="100%">
        <path
          fill="currentColor"
          d="M50 0C25 0 0 25 0 50v200c0 25 25 50 50 50h100c25 0 50-25 50-50V50c0-25-25-50-50-50H50zm50 100c0 27.6 22.4 50 50 50s50-22.4 50-50c0-27.6-22.4-50-50-50s-50 22.4-50 50z"
        />
      </svg>
    ),
    color: 'from-purple-600 to-purple-500',
  },
  {
    name: 'React',
    svg: (
      <svg viewBox="0 0 256 228" width="100%" height="100%">
        <circle cx="128" cy="114" r="26" fill="currentColor" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="24"
          d="M128 114c-35 58-52 87-67 87-15 0-32-29-67-87m134 0c35 58 52 87 67 87 15 0 32-29 67-87m-134 0c58-35 87-52 87-67 0-15-29-32-87-67m0 134c58 35 87 52 87 67 0 15-29 32-87 67"
        />
      </svg>
    ),
    color: 'from-cyan-400 to-cyan-500',
  },
  {
    name: 'Next.js',
    svg: (
      <svg viewBox="0 0 394 79" width="100%" height="100%">
        <path
          fill="currentColor"
          d="M262 0h68.5v12.7h-45.4v12.6h42.7V38h-42.7v26.2h45.4v12.6H262V0zm-16 0h-15v34.6c0 4.3-1.7 6.5-5.8 6.5-3.8 0-5.8-2.2-5.8-6.5V0h-15v36.5c0 10.3 6 16.4 15.9 16.4 5.4 0 9.1-2.7 10.7-7.5V52h15V0zm45.7 48.3V5.1H298v43.2c0 10.7 3.3 15.1 10.9 15.1 5.7 0 12.3-3.9 15.4-7.7v15.7c-3.2 1.7-11 4.3-20.7 4.3-15.4 0-24-9.1-24-24.6"
        />
      </svg>
    ),
    color: 'from-black to-gray-800',
  },
  {
    name: 'Node.js',
    svg: (
      <svg viewBox="0 0 400 240" width="100%" height="100%">
        <path
          fill="currentColor"
          d="M200 40c-55 0-100 45-100 100s45 100 100 100 100-45 100-100-45-100-100-100m0 20c44 0 80 36 80 80s-36 80-80 80-80-36-80-80 36-80 80-80m-30 50l30-20 30 20v40l-30 20-30-20v-40"
        />
      </svg>
    ),
    color: 'from-green-500 to-green-600',
  },
  {
    name: 'Vue.js',
    svg: (
      <svg viewBox="0 0 261.76 226.69" width="100%" height="100%">
        <path
          fill="currentColor"
          d="M161.096.001l-30.225 52.351h-30.225L130.872.001h30.224zM230.19 0L130.872 149.8 31.744 0H0l130.872 226.688L261.744 0h-31.554z"
        />
      </svg>
    ),
    color: 'from-green-400 to-green-500',
  },
  {
    name: 'Tailwind CSS',
    svg: (
      <svg viewBox="0 0 256 154" width="100%" height="100%">
        <defs>
          <linearGradient x1="0%" y1="0%" x2="100%" y2="100%" id="grad">
            <stop offset="0%" stopColor="currentColor" />
            <stop offset="100%" stopColor="currentColor" />
          </linearGradient>
        </defs>
        <path
          fill="url(#grad)"
          d="M128 0C57.3 0 0 57.3 0 128c0 70.7 57.3 128 128 128s128-57.3 128-128S198.7 0 128 0m-50 72c13.3 0 20 6.7 26.7 20L128 72c26.7 0 40 13.3 40 40s-13.3 40-40 40-40-13.3-40-40 13.3-40 40-40"
        />
      </svg>
    ),
    color: 'from-cyan-400 to-blue-500',
  },
  {
    name: 'Bootstrap',
    svg: (
      <svg viewBox="0 0 612 612" width="100%" height="100%">
        <path
          fill="currentColor"
          d="M612 510c0 56.1-45.9 102-102 102H102C45.9 612 0 566.1 0 510V102C0 45.9 45.9 0 102 0h408c56.1 0 102 45.9 102 102v408zM337.7 215.7h-75.9v136.8h75.9c20.5 0 31-12 31-32.6v-71.6c0-20.2-10.5-32.6-31-32.6zm0 190.1h-75.9V500h75.9c20.5 0 31-12 31-32.6v-71.6c0-20.2-10.5-32.6-31-32.6z"
        />
      </svg>
    ),
    color: 'from-purple-600 to-purple-700',
  },
  {
    name: 'HTML5',
    svg: (
      <svg viewBox="0 0 512 512" width="100%" height="100%">
        <path
          fill="#E34C26"
          d="M71.357 460.819L30.272 0h451.456l-41.135 460.766L255.724 512z"
        />
        <path fill="#EF652A" d="M256 480.514V131.631H392.064l-10.465 117.627H256z" />
        <path fill="#EBEBEB" d="M149.966 179.504h102.632v117.627H120.779z" />
        <path fill="#FFFFFF" d="M288.745 297.131H162.879l-12.604 141.383 151.473 41.959z" />
      </svg>
    ),
    color: 'from-red-500 to-orange-500',
  },
  {
    name: 'CSS3',
    svg: (
      <svg viewBox="0 0 512 512" width="100%" height="100%">
        <path fill="#264de4" d="M71.357 460.819L30.272 0h451.456l-41.135 460.766L255.724 512z" />
        <path fill="#2965f1" d="M256 480.514V131.631H392.064l-10.465 117.627H256z" />
        <path fill="#EBEBEB" d="M162.879 280.383h102.632v117.627H150.275z" />
        <path fill="#FFFFFF" d="M288.745 297.131H162.879l12.604 141.383 151.473-41.959z" />
      </svg>
    ),
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'PHP',
    svg: (
      <svg viewBox="0 0 711.2 711.2" width="100%" height="100%">
        <circle cx="355.6" cy="355.6" r="355.6" fill="currentColor" opacity="0.1" />
        <path
          fill="currentColor"
          d="M213.6 341.2c0-29.1 23.6-52.7 52.7-52.7h178.4c29.1 0 52.7 23.6 52.7 52.7v178.4c0 29.1-23.6 52.7-52.7 52.7H266.3c-29.1 0-52.7-23.6-52.7-52.7V341.2z"
        />
        <text x="355.6" y="450" fontSize="200" fontWeight="bold" textAnchor="middle" fill="white">
          PHP
        </text>
      </svg>
    ),
    color: 'from-indigo-600 to-purple-600',
  },
  {
    name: 'WordPress',
    svg: (
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <circle cx="100" cy="100" r="95" fill="currentColor" />
        <path
          fill="white"
          d="M100 30c-38.6 0-70 31.4-70 70s31.4 70 70 70 70-31.4 70-70-31.4-70-70-70zm0 130c-33.1 0-60-26.9-60-60s26.9-60 60-60 60 26.9 60 60-26.9 60-60 60zm-10-95c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm20 0c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10z"
        />
      </svg>
    ),
    color: 'from-blue-700 to-blue-800',
  },
  {
    name: 'Sass',
    svg: (
      <svg viewBox="0 0 512 384" width="100%" height="100%">
        <path fill="#C69" d="M0 0h512v384H0z" />
        <path
          fill="#FFF"
          d="M150 180c25-50 75-75 100-75 50 0 100 25 125 75l-25 50c-20-40-50-60-100-60-25 0-50 15-75 50l-25-40z"
        />
      </svg>
    ),
    color: 'from-pink-500 to-pink-600',
  },
  {
    name: 'Framer',
    svg: (
      <svg viewBox="0 0 100 100" width="100%" height="100%">
        <path fill="currentColor" d="M0 0h100v30H0zM0 35h100v30H0zM0 70h100v30H0z" />
      </svg>
    ),
    color: 'from-black to-gray-800',
  },
];

// Duplicate for seamless infinite scroll
const duplicatedTech = [...techStack, ...techStack];

interface TechLogoProps {
  name: string;
  svg: React.ReactNode;
  color: string;
}

function TechLogo({ name, svg, color }: TechLogoProps) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      className="shrink-0 flex flex-col items-center gap-3 cursor-default group"
    >
      {/* Logo Container */}
      <div
        className={`w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gradient-to-br ${color} p-3 flex items-center justify-center shadow-sm group-hover:shadow-lg group-hover:shadow-teal-500/20 transition-all duration-300`}
      >
        <div className="w-full h-full flex items-center justify-center text-white filter grayscale-[80%] group-hover:grayscale-0 transition-all duration-300">
          {svg}
        </div>
      </div>

      {/* Label */}
      <span className="body-base font-semibold text-gray-700 group-hover:text-teal-600 transition-colors duration-300 whitespace-nowrap text-center">
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

