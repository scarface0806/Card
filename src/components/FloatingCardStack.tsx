'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi } from 'lucide-react';

interface FloatingCardStackProps {
  onMouseMove?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function FloatingCardStack({ onMouseMove }: FloatingCardStackProps) {
  const [isHovered, setIsHovered] = useState(false);

  const cards = [
    {
      id: 1,
      gradient: 'from-purple-600 via-teal-500 to-cyan-400',
      offset: { x: -12, y: -12 },
      rotation: -8,
    },
    {
      id: 2,
      gradient: 'from-teal-600 via-emerald-500 to-cyan-300',
      offset: { x: -8, y: -8 },
      rotation: -4,
    },
    {
      id: 3,
      gradient: 'from-emerald-600 via-teal-500 to-blue-400',
      offset: { x: -4, y: -4 },
      rotation: 0,
    },
    {
      id: 4,
      gradient: 'from-cyan-500 via-teal-600 to-emerald-700',
      offset: { x: 0, y: 0 },
      rotation: 4,
    },
  ];

  return (
    <motion.div
      className="relative w-full h-full flex items-center justify-center"
      onMouseMove={onMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating container with perspective */}
      <div className="relative w-96 h-64 perspective">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            className="absolute inset-0"
            animate={{
              x: isHovered ? card.offset.x * 1.5 : card.offset.x,
              y: isHovered ? card.offset.y * 1.5 : card.offset.y,
              rotateZ: isHovered ? card.rotation * 1.2 : card.rotation,
            }}
            transition={{
              type: 'tween',
              duration: 0.32,
              ease: [0.25, 0.1, 0.25, 1],
              delay: index * 0.03,
            }}
          >
            {/* Card Body */}
            <div
              className={`relative w-full h-full rounded-3xl bg-linear-to-br ${card.gradient} 
                shadow-2xl overflow-hidden transform perspective`}
              style={{
                boxShadow: `0 24px 48px rgba(0, 0, 0, 0.4), 
                           inset 0 1px 0 rgba(255, 255, 255, 0.2)`,
              }}
            >
              {/* Shine effect overlay */}
              <div
                className="absolute inset-0 bg-linear-to-br from-white/5 via-transparent to-transparent"
                style={{
                  animation: `shine 3s ease-in-out infinite`,
                }}
              />

              {/* Card Content */}
              <div className="relative w-full h-full flex flex-col justify-between p-6">
                {/* Top: NFC Icon + Label */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">
                      NFC Card
                    </p>
                    <p className="text-sm font-medium text-white/80 mt-1">Premium Digital</p>
                  </div>
                  <motion.div
                    animate={{
                      scale: isHovered ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                    className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
                  >
                    <Wifi className="w-4 h-4 text-white rotate-45" />
                  </motion.div>
                </div>

                {/* Bottom: Cardholder Info */}
                <div>
                  <p className="text-white/40 text-xs uppercase tracking-widest">Cardholder</p>
                  <p className="text-white font-bold text-lg mt-1">John Doe</p>
                  <p className="text-white/60 text-sm">Product Designer</p>
                </div>
              </div>

              {/* Animated glow border (top) */}
              <motion.div
                className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  opacity: isHovered ? 0.6 : 0.3,
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%) translateY(-100%);
          }
          50% {
            transform: translateX(100%) translateY(100%);
          }
          100% {
            transform: translateX(100%) translateY(100%);
          }
        }

        .perspective {
          perspective: 1000px;
        }
      `}</style>
    </motion.div>
  );
}

