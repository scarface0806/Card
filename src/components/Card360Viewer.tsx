'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const cardDesigns = [
  {
    id: 1,
    name: 'Obsidian Dark',
    gradient: 'from-slate-900 via-gray-800 to-black',
    accent: 'from-blue-400 to-cyan-300',
    icon: '🌙',
    description: 'Premium dark with blue accent',
  },
  {
    id: 2,
    name: 'Ocean Depth',
    gradient: 'from-blue-700 via-blue-800 to-cyan-900',
    accent: 'from-cyan-300 to-blue-200',
    icon: '🌊',
    description: 'Deep ocean with cyan highlights',
  },
  {
    id: 3,
    name: 'Emerald Luxe',
    gradient: 'from-emerald-700 via-teal-800 to-green-900',
    accent: 'from-emerald-300 to-teal-200',
    icon: '💎',
    description: 'Elegant emerald premium',
  },
  {
    id: 4,
    name: 'Rose Gold',
    gradient: 'from-rose-800 via-pink-900 to-amber-900',
    accent: 'from-rose-300 to-amber-200',
    icon: '✨',
    description: 'Warm rose gold elegance',
  },
  {
    id: 5,
    name: 'Midnight Purple',
    gradient: 'from-purple-900 via-purple-800 to-indigo-900',
    accent: 'from-purple-300 to-pink-200',
    icon: '🌌',
    description: 'Deep purple with magic',
  },
  {
    id: 6,
    name: 'Forest Green',
    gradient: 'from-green-800 via-emerald-900 to-teal-900',
    accent: 'from-green-300 to-emerald-200',
    icon: '🌲',
    description: 'Natural forest sophistication',
  },
];

interface Card360ViewerProps {
  selectedCardIndex?: number;
}

export default function Card360Viewer({ selectedCardIndex }: Card360ViewerProps) {
  const [currentCard, setCurrentCard] = useState(selectedCardIndex ?? 0);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync with parent selectedCardIndex prop
  useEffect(() => {
    if (selectedCardIndex !== undefined && selectedCardIndex !== currentCard) {
      setCurrentCard(selectedCardIndex);
      setRotation(0);
    }
  }, [selectedCardIndex, currentCard]);

  const card = cardDesigns[currentCard];

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const xPercent = (x / rect.width) * 100;
    
    // Map mouse position to rotation (0-360 degrees)
    const newRotation = (xPercent / 100) * 360;
    setRotation(newRotation);
  };

  const nextCard = () => {
    setCurrentCard((prev) => (prev + 1) % cardDesigns.length);
    setRotation(0);
  };

  const prevCard = () => {
    setCurrentCard((prev) => (prev - 1 + cardDesigns.length) % cardDesigns.length);
    setRotation(0);
  };

  return (
    <div className="w-full space-y-0">
      {/* 360 Viewer Container */}
      <div className="relative flex flex-col items-center justify-center w-full h-full">
        {/* Interactive Card Viewer */}
        <motion.div
          ref={containerRef}
          className="relative w-full h-[380px] sm:h-[480px] md:h-[600px] lg:h-[700px] rounded-3xl overflow-hidden cursor-grab active:cursor-grabbing bg-transparent"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setRotation(0);
          }}
          style={{ perspective: '1200px' }}
        >
          {/* Background instruction text - Hidden */}
          {!isHovered && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0">
              <div className="text-center">
                <p className="text-gray-400 text-sm font-medium">Drag left/right to rotate</p>
              </div>
            </div>
          )}

          {/* 3D Card with 360 Rotation */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              rotateY: rotation,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
            }}
            style={{
              transformStyle: 'preserve-3d',
            } as React.CSSProperties}
          >
            {/* Front of Card */}
            <motion.div
              className={`absolute w-[360px] sm:w-[420px] md:w-[500px] lg:w-[560px] h-[220px] sm:h-[260px] md:h-[310px] lg:h-[360px] rounded-3xl overflow-hidden bg-gradient-to-br ${card.gradient} border border-white/15`}
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                boxShadow: '0 40px 80px rgba(0, 0, 0, 0.2), 0 15px 40px rgba(0, 0, 0, 0.1)',
              } as React.CSSProperties}
            >
              {/* Top-left glow gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />

              {/* Inner shadow depth */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow:
                    'inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -40px 50px rgba(0,0,0,0.35)',
                }}
              />

              {/* Card Content */}
              <div className="relative h-full flex flex-col justify-between p-5 md:p-6 lg:p-8 text-white">
                {/* Top: Brand/Label */}
                <div>
                  <p className="text-xs md:text-sm lg:text-base font-semibold tracking-widest text-white/60 uppercase">
                    NFC Card
                  </p>
                  <p className="text-xs md:text-sm lg:text-base text-white/50 mt-1">{card.name}</p>
                </div>

                {/* Bottom: Details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs md:text-sm lg:text-base text-white/70 mb-1">Cardholder</p>
                    <h3 className="text-xl md:text-2xl lg:text-3xl font-bold">John Doe</h3>
                    <p className="text-xs md:text-sm lg:text-base text-white/70 mt-1">Product Designer</p>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-white/10">
                    <div>
                      <p className="text-xs text-white/50 uppercase tracking-wider">ID</p>
                      <p className="text-xs md:text-sm lg:text-base font-mono tracking-wider mt-1">1234...9010</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-white/50 uppercase tracking-wider">Valid</p>
                      <p className="text-xs md:text-sm lg:text-base font-mono mt-1">09/25</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shine animation */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent`}
                animate={{
                  x: ['-100%', '100%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
              />
            </motion.div>

            {/* Back of Card (Rotated 180 degrees) */}
            <motion.div
              className={`absolute w-[360px] sm:w-[420px] md:w-[500px] lg:w-[560px] h-[220px] sm:h-[260px] md:h-[310px] lg:h-[360px] rounded-3xl overflow-hidden bg-gradient-to-br ${card.gradient} border border-white/15`}
              style={{
                rotateY: 180,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                boxShadow: '0 40px 80px rgba(0, 0, 0, 0.2), 0 15px 40px rgba(0, 0, 0, 0.1)',
              } as React.CSSProperties}
            >
              {/* Gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-40`} />

              {/* Inner shadow depth */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow:
                    'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -30px 40px rgba(0,0,0,0.3)',
                }}
              />

              {/* Back Side Content */}
              <div className="relative h-full flex items-center justify-center text-white">
                <div className="text-center space-y-4 px-4">
                  <div className="text-5xl md:text-6xl lg:text-8xl">{card.icon}</div>
                  <div>
                    <p className="text-sm md:text-base lg:text-lg font-semibold">{card.description}</p>
                    <p className="text-xs md:text-xs lg:text-sm text-white/60 mt-1">Tap to unlock profile</p>
                  </div>
                  <div className="pt-3 border-t border-white/20">
                    <p className="text-xs text-white/50 uppercase tracking-wider">NFC Enabled</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Rotation Indicator */}
          {isHovered && (
            <motion.div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/20">
                <div className="w-1.5 h-1.5 bg-white/60 rounded-full" />
                <p className="text-xs text-white/80 font-medium">
                  {Math.round(rotation)}°
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Card Selection Buttons - Hidden */}
        <div className="hidden flex items-center gap-4 mt-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={prevCard}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </motion.button>

          {/* Card Indicator Dots */}
          <div className="flex gap-2">
            {cardDesigns.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => {
                  setCurrentCard(idx);
                  setRotation(0);
                }}
                className={`h-2 rounded-full transition-all ${
                  idx === currentCard ? 'bg-blue-600 w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'
                }`}
                whileHover={{ scale: 1.1 }}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={nextCard}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </motion.button>
        </div>
      </div>

      {/* Card Design Grid Below - Hidden on Mobile/Tablet, Hidden by Default */}
      <div className="hidden mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {cardDesigns.map((design, idx) => (
          <motion.button
            key={design.id}
            onClick={() => {
              setCurrentCard(idx);
              setRotation(0);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`group relative rounded-xl overflow-hidden h-24 border-2 transition-all ${
              idx === currentCard
                ? 'border-blue-600 shadow-lg shadow-blue-600/30'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Gradient preview */}
            <div className={`absolute inset-0 bg-gradient-to-br ${design.gradient}`} />
            <div className={`absolute inset-0 bg-gradient-to-br ${design.accent} opacity-30`} />

            {/* Top-left glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />

            {/* Icon + Name */}
            <div className="relative h-full flex flex-col items-center justify-center gap-1">
              <p className="text-2xl">{design.icon}</p>
              <p className="text-xs font-semibold text-white text-center px-1 leading-tight">
                {design.name.split(' ')[0]}
              </p>
            </div>

            {/* Selected indicator */}
            {idx === currentCard && (
              <motion.div
                layoutId="selectedCard"
                className="absolute inset-0 border-2 border-white rounded-lg"
                transition={{ type: 'spring', bounce: 0.2 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Card Info Section - REMOVED */}
    </div>
  );
}
