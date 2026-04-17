'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, Phone, Mail, Globe, TrendingUp } from 'lucide-react';
import { CardTemplate } from '@/utils/cardTemplates';

interface InteractiveCard3DProps {
  fullName?: string;
  designation?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  template?: CardTemplate;
  statsData?: {
    metric: string;
    value: string;
    icon?: React.ReactNode;
  }[];
}

const cardGradients = [
  'from-slate-700 via-slate-800 to-slate-900',
  'from-purple-500 via-pink-500 to-purple-600',
  'from-blue-400 via-cyan-400 to-blue-500',
  'from-pink-500 via-purple-600 to-blue-500',
];

export default function InteractiveCard3D({
  fullName = 'John Doe',
  designation = 'Product Designer',
  company = 'Creative Studio',
  phone = '+1 234 567 890',
  email = 'john@example.com',
  website = 'johndoe.com',
  template,
  statsData = [
    { metric: 'Profile Views', value: '+247%', icon: <TrendingUp className="w-4 h-4" /> },
  ],
}: InteractiveCard3DProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const rotateXValue = (y - rect.height / 2) / 15;
    const rotateYValue = (x - rect.width / 2) / -15;

    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  const cardColor = template?.color || '#0d9488';

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
      {/* Stacked 3D Cards Container */}
      <motion.div
        className="relative w-full max-w-lg h-96 perspective"
        style={{ perspective: '1200px' }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Stacked Cards */}
        {[0, 1, 2, 3].map((idx) => (
          <motion.div
            key={idx}
            className={`absolute w-80 h-48 rounded-3xl overflow-hidden shadow-2xl cursor-pointer bg-gradient-to-br ${cardGradients[idx]}`}
            style={{
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            } as React.CSSProperties}
            animate={{
              rotateX: isHovered ? rotateX : 0,
              rotateY: isHovered ? rotateY : 0,
              rotateZ: isHovered ? -8 + idx * 4 : -12 + idx * 4,
              y: idx * 20,
              x: idx * 24,
              scale: isHovered ? 1.01 : 1,
            }}
            transition={{
              type: 'tween',
              duration: 0.22,
              ease: [0.25, 0.1, 0.25, 1],
              delay: idx * 0.03,
            }}
          >
            {/* Glossy Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none" />

            {/* NFC Icon - Top Right */}
            <div className="absolute top-6 right-6 z-20">
              <motion.div
                animate={{ rotate: isHovered ? 45 : 0 }}
                transition={{ duration: 0.6, delay: idx * 0.05 }}
              >
                <Wifi className="w-6 h-6 text-white/60" />
              </motion.div>
            </div>

            {/* Card Content - Bottom Left */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
              >
                {idx === 0 && (
                  <>
                    <p className="text-white/70 text-xs uppercase tracking-wider font-medium">
                      Card Holder
                    </p>
                    <h3 className="text-white font-bold text-md leading-tight mt-2">
                      {fullName}
                    </h3>
                    <div className="flex justify-between items-end mt-3">
                      <div>
                        <p className="text-white/60 text-xs">Card Number</p>
                        <p className="text-white font-mono text-sm tracking-wider">
                          1234 5678 9101 9010
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/60 text-xs">VALID THRU</p>
                        <p className="text-white font-mono text-sm">09/25</p>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        ))}

        {/* Shadow Effect */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-56 bg-gradient-to-br from-purple-500/40 via-pink-400/30 to-blue-400/40 rounded-3xl blur-3xl -z-10"
          animate={{
            opacity: isHovered ? 0.8 : 0.4,
            scale: isHovered ? 1.15 : 1,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Right Side Content */}
      <motion.div
        className="flex-1 max-w-sm"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Stats Section */}
        {statsData && statsData.length > 0 && (
          <motion.div
            className="mb-8 p-4 bg-white rounded-xl shadow-lg border border-gray-100"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="flex items-center justify-between">
              {statsData.map((stat, idx) => (
                <motion.div
                  key={idx}
                  className="flex flex-col items-center"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  {stat.icon && (
                    <div className="mb-2 text-primary">{stat.icon}</div>
                  )}
                  <p className="text-lg md:text-2xl font-bold text-[#0d9488]">
                    {stat.value}
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 mt-1 text-center">
                    {stat.metric}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Contact Information Card */}
        <motion.div
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <div className="bg-gradient-to-r from-[#0d9488] to-emerald-600 p-6">
            <h3 className="text-white font-bold text-lg">{fullName}</h3>
            <p className="text-white/90 text-sm">{designation}</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Phone */}
            <motion.div
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
              whileHover={{ x: 3 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/15 transition-colors">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium text-gray-700">{phone}</p>
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
              whileHover={{ x: 3 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-secondary/15 transition-colors">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-700">{email}</p>
              </div>
            </motion.div>

            {/* Website */}
            <motion.div
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
              whileHover={{ x: 3 }}
              transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="p-2 bg-cyan-100 rounded-lg group-hover:bg-cyan-200 transition-colors">
                <Globe className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-gray-500">Website</p>
                <p className="text-sm font-medium text-gray-700">{website}</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
