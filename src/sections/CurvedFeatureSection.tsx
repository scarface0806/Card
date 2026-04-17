'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap, Shield, Users } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

const floatAnimation = {
  y: [-5, 5, -5],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

const floatAnimationSlow = {
  y: [-8, 8, -8],
  transition: {
    duration: 5,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

const floatAnimationFast = {
  y: [-4, 4, -4],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  floatVariant?: 'slow' | 'medium' | 'fast';
  delay?: number;
}

function FeatureCard({ icon, title, description, className = '', floatVariant = 'medium', delay = 0 }: FeatureCardProps) {
  const getFloatAnimation = () => {
    switch (floatVariant) {
      case 'slow': return floatAnimationSlow;
      case 'fast': return floatAnimationFast;
      default: return floatAnimation;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      className={`absolute hidden lg:block ${className}`}
    >
      <motion.div
        animate={getFloatAnimation()}
        className="card card-padding max-w-[280px]"
      >
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg shadow-primary-glow">
          {icon}
        </div>
        <h3 className="heading-3 section-title font-space-grotesk mb-2">
          {title}
        </h3>
        <p className="body-base text-[#4a6d63] leading-relaxed">
          {description}
        </p>
      </motion.div>
    </motion.div>
  );
}

export default function CurvedFeatureSection() {
  const features = [
    {
      icon: <Zap className="w-5 h-5 text-white" />,
      title: 'Share Instantly Anywhere',
      description: 'Tap your NFC card and instantly share your profile without apps.',
    },
    {
      icon: <Shield className="w-5 h-5 text-white" />,
      title: 'Full Control Over Your Profile',
      description: 'Update your digital card anytime with real-time changes.',
    },
    {
      icon: <Users className="w-5 h-5 text-white" />,
      title: 'Built for Professionals',
      description: 'Perfect for entrepreneurs, creators, and businesses.',
    },
  ];

  return (
    <section className="relative min-h-[900px] lg:min-h-[1000px] overflow-hidden">
      {/* Base Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#f4f7f6] via-[#e8f2ef] to-[#ffffff]" />

      {/* Radial Gradient Overlay */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 20% 80%, rgba(0,150,120,0.12), transparent 60%)',
        }}
      />

      {/* Secondary Radial Glow */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 80% 20%, rgba(20,184,166,0.08), transparent 50%)',
        }}
      />

      {/* Large Curved Arc Line */}
      <div className="absolute -bottom-[600px] -left-[200px] w-[1200px] h-[1200px] rounded-full border-2 border-primary/30 hidden lg:block" />
      
      {/* Second Arc Line for depth */}
      <div className="absolute -bottom-[650px] -left-[250px] w-[1300px] h-[1300px] rounded-full border border-primary/15 hidden lg:block" />

      {/* Third Arc Line */}
      <div className="absolute -bottom-[550px] -left-[150px] w-[1100px] h-[1100px] rounded-full border border-primary/20 hidden lg:block" />

      {/* Decorative Dots */}
      <div className="absolute top-32 right-20 w-2 h-2 rounded-full bg-primary/100/40 hidden lg:block" />
      <div className="absolute top-48 right-32 w-3 h-3 rounded-full bg-emerald-400/30 hidden lg:block" />
      <div className="absolute bottom-40 right-40 w-2 h-2 rounded-full bg-primary/50 hidden lg:block" />

      {/* Content Container */}
      <div className="relative site-container section-spacing">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="section-header"
        >
          {/* Small Label */}
          <motion.div
            variants={fadeInUp}
            className="section-badge"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              The Future of Networking, Today
            </span>
          </motion.div>

          {/* Large Heading */}
          <motion.h2
            variants={fadeInUp}
            className="heading-1 section-title font-space-grotesk leading-tight max-w-4xl mx-auto"
          >
            NFC built for effortless{' '}
            <span className="text-gradient">
              digital sharing.
            </span>
          </motion.h2>
        </motion.div>

        {/* Feature Cards - Desktop Positioned */}
        <div className="relative h-[400px] hidden lg:block">
          {/* Feature 1 - Left Side */}
          <FeatureCard
            icon={<Zap className="w-5 h-5 text-white" />}
            title="Share Instantly Anywhere"
            description="Tap your NFC card and instantly share your profile without apps."
            className="top-0 left-[5%]"
            floatVariant="slow"
            delay={0.1}
          />

          {/* Feature 2 - Right Side */}
          <FeatureCard
            icon={<Shield className="w-5 h-5 text-white" />}
            title="Full Control Over Your Profile"
            description="Update your digital card anytime with real-time changes."
            className="top-10 right-[8%]"
            floatVariant="medium"
            delay={0.3}
          />

          {/* Feature 3 - Lower Center */}
          <FeatureCard
            icon={<Users className="w-5 h-5 text-white" />}
            title="Built for Professionals"
            description="Perfect for entrepreneurs, creators, and businesses."
            className="bottom-0 left-1/2 -translate-x-1/2"
            floatVariant="fast"
            delay={0.5}
          />
        </div>

        {/* Mobile Feature Cards - Stacked */}
        <div className="lg:hidden space-y-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card card-padding"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 shadow-lg shadow-primary-glow">
                {feature.icon}
              </div>
              <h3 className="heading-3 section-title font-space-grotesk mb-2">
                {feature.title}
              </h3>
              <p className="body-base text-[#4a6d63] leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Center Visual Element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 hidden lg:block pointer-events-none"
        >
          {/* Glowing orb */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 blur-2xl" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-teal-500/30 to-secondary/30 blur-xl" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

