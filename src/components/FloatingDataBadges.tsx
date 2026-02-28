'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Zap, Smartphone } from 'lucide-react';

export default function FloatingDataBadges() {
  const badges = [
    {
      id: 1,
      icon: TrendingUp,
      label: 'Profile Views',
      value: '+247%',
      position: { top: '10%', right: '5%' },
      delay: 0,
      float: { x: 0, y: -20 },
    },
    {
      id: 2,
      icon: Zap,
      label: '1 Tap Share',
      value: 'Instant',
      position: { bottom: '20%', left: '5%' },
      delay: 0.2,
      float: { x: -15, y: 15 },
    },
    {
      id: 3,
      icon: Smartphone,
      label: 'No App',
      value: 'Required',
      position: { bottom: '15%', right: '8%' },
      delay: 0.4,
      float: { x: 15, y: 10 },
    },
  ];

  return (
    <>
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <motion.div
            key={badge.id}
            className="absolute"
            style={badge.position as any}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.6,
              delay: badge.delay,
              ease: 'easeOut',
            }}
          >
            <motion.div
              animate={{
                y: [0, badge.float.y * 0.5, 0],
                x: [0, badge.float.x * 0.5, 0],
              }}
              transition={{
                duration: 4 + badge.delay,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4 
                         hover:bg-white/10 hover:border-cyan-400/30 transition-all duration-300
                         shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400/20 to-teal-500/20 
                              flex items-center justify-center border border-cyan-400/30">
                  <Icon className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide font-medium">
                    {badge.label}
                  </p>
                  <p className="text-sm font-bold text-transparent bg-clip-text 
                               bg-gradient-to-r from-cyan-300 to-teal-300">
                    {badge.value}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        );
      })}
    </>
  );
}
