'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Colourways.
 *
 * `face` and `back` are real CSS gradients rather than Tailwind palette
 * classes so each finish can be mixed as a material - three or four stops with
 * a light top edge and a shadowed lower body - instead of being limited to the
 * two-stop utility ramps. Rose Gold in particular could not be expressed as a
 * `from-rose-800 via-pink-900` ramp; it read as maroon.
 *
 * NOTE: InteractiveCardShowcaseSection selects into this list by index. Its
 * first four entries must stay in this order.
 */
const cardDesigns = [
  {
    id: 1,
    name: 'Obsidian Dark',
    face: 'linear-gradient(145deg, #2C3134 0%, #171B1D 45%, #0A0C0D 100%)',
    back: 'linear-gradient(145deg, #3A4145 0%, #14181A 100%)',
    icon: '🌙',
    description: 'Brushed graphite, matte finish',
  },
  {
    id: 2,
    name: 'Ocean Depth',
    face: 'linear-gradient(145deg, #1E5567 0%, #123B4B 45%, #071E29 100%)',
    back: 'linear-gradient(145deg, #2A7288 0%, #0A2431 100%)',
    icon: '🌊',
    description: 'Deep teal with a cold sheen',
  },
  {
    id: 3,
    name: 'Emerald Luxe',
    face: 'linear-gradient(145deg, #328565 0%, #1B5A44 45%, #0B3125 100%)',
    back: 'linear-gradient(145deg, #46A783 0%, #0E3A2B 100%)',
    icon: '💎',
    description: 'Mineral green, polished edge',
  },
  {
    id: 4,
    name: 'Rose Gold',
    face: 'linear-gradient(145deg, #E8B49C 0%, #BE7C61 32%, #8A5240 68%, #5A2F24 100%)',
    back: 'linear-gradient(145deg, #F3CDBC 0%, #8E5142 100%)',
    icon: '✨',
    description: 'Warm copper-rose plating',
  },
  {
    id: 5,
    name: 'Midnight Purple',
    face: 'linear-gradient(145deg, #524075 0%, #362B57 45%, #181231 100%)',
    back: 'linear-gradient(145deg, #6B549A 0%, #1D1638 100%)',
    icon: '🌌',
    description: 'Deep violet, soft lustre',
  },
  {
    id: 6,
    name: 'Forest Green',
    face: 'linear-gradient(145deg, #356246 0%, #1E4030 45%, #0C2117 100%)',
    back: 'linear-gradient(145deg, #427B58 0%, #10281B 100%)',
    icon: '🌲',
    description: 'Dark forest, low sheen',
  },
];

interface Card360ViewerProps {
  selectedCardIndex?: number;
}

export default function Card360Viewer({ selectedCardIndex }: Card360ViewerProps) {
  const prefersReducedMotion = useReducedMotion();
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
    // Rotation is the whole effect here, so for reduced motion the card simply
    // stays flat rather than tracking the pointer.
    if (prefersReducedMotion) return;
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
    <div className="w-full" style={{ overflow: 'visible' }}>
      {/* 360 Viewer Container */}
      <div className="relative flex flex-col items-center justify-center w-full" style={{ overflow: 'visible' }}>
        {/* Interactive Card Viewer */}
        <motion.div
          ref={containerRef}
          className="relative w-full h-[220px] sm:h-[260px] md:h-[300px] lg:h-[320px] rounded-3xl cursor-grab active:cursor-grabbing bg-transparent"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setRotation(0);
          }}
          style={{ perspective: '1200px', overflow: 'visible' }}
        >
          {/* Background instruction text - Hidden */}
          {!isHovered && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0">
              <div className="text-center">
                <p className="text-gray-400 text-sm font-medium">Drag left/right to rotate</p>
              </div>
            </div>
          )}

          {/* 3D Card with 360 Rotation - GPU accelerated, no spring */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              rotateY: rotation,
            }}
            transition={{
              type: 'tween',
              duration: 0.15,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            style={{
              transformStyle: 'preserve-3d',
              // Promote to its own layer only while the pointer is actually
              // over the card. A permanent will-change keeps a compositor
              // layer alive for a card nobody is touching.
              willChange: isHovered ? 'transform' : 'auto',
            } as React.CSSProperties}
          >
            {/* Front of Card */}
            <motion.div
              className="absolute w-[280px] sm:w-[320px] md:w-[380px] lg:w-[420px] h-[175px] sm:h-[200px] md:h-[240px] lg:h-[260px] rounded-2xl overflow-hidden border border-white/15"
              style={{
                background: card.face,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                boxShadow: '0 48px 96px rgba(0, 0, 0, 0.55), 0 18px 44px rgba(0, 0, 0, 0.38)',
                transformOrigin: 'center center',
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

              {/* Text scrim. The lighter finishes (Rose Gold especially) put
                  white type on a pale ground - white on the old #D2937D stop
                  measured 2.56:1. This darkens the lower third so the name,
                  role and URL stay legible on every colourway. */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.28) 34%, rgba(0,0,0,0) 62%)',
                }}
              />

              {/* Card Content - a contact card, not a payment card.
                  The card number, "Valid" and the expiry date are gone: this
                  product shares contact details, and an expiry signalled the
                  opposite of "your profile stays live". */}
              <div className="relative h-full flex flex-col justify-between p-4 md:p-5 lg:p-6 text-white">
                {/* Top: NFC mark + colourway name */}
                <div className="flex items-start justify-between">
                  <p
                    className="text-[10px] lg:text-[11px] font-semibold uppercase text-white/65"
                    style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', letterSpacing: '0.16em' }}
                  >
                    {card.name}
                  </p>
                  {/* NFC wave mark */}
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 lg:w-6 lg:h-6 text-white/55 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M8.5 5.5a9 9 0 0 1 0 13" />
                    <path d="M12.5 3a13 13 0 0 1 0 18" />
                    <path d="M4.5 8.5a5 5 0 0 1 0 7" />
                  </svg>
                </div>

                {/* Bottom: the person */}
                <div>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold leading-tight">Ananya Rao</p>
                  <p className="text-xs md:text-xs lg:text-sm text-white/70 mt-0.5">
                    Design Lead
                  </p>

                  <div className="flex items-center justify-between gap-3 mt-3 lg:mt-4 pt-3 border-t border-white/15">
                    <p
                      className="text-[10px] lg:text-[11px] text-white/70 truncate"
                      style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', letterSpacing: '0.08em' }}
                    >
                      tapvyo.com/ananya
                    </p>
                    <p
                      className="text-[10px] lg:text-[11px] uppercase text-white/55 shrink-0"
                      style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace', letterSpacing: '0.14em' }}
                    >
                      Tap to open
                    </p>
                  </div>
                </div>
              </div>

              {/* Specular rake - a hard light edge travelling across the face,
                  so the card reads as a physical object catching light. */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.16) 46%, rgba(255,255,255,0.30) 50%, rgba(255,255,255,0.12) 54%, transparent 70%)',
                }}
              />

              {/* Subtle shine - static gradient */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50 pointer-events-none"
              />
            </motion.div>

            {/* Back of Card (Rotated 180 degrees) */}
            <motion.div
              className="absolute w-[280px] sm:w-[320px] md:w-[380px] lg:w-[420px] h-[175px] sm:h-[200px] md:h-[240px] lg:h-[260px] rounded-2xl overflow-hidden border border-white/15"
              style={{
                background: card.back,
                rotateY: 180,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                boxShadow: '0 48px 96px rgba(0, 0, 0, 0.55), 0 18px 44px rgba(0, 0, 0, 0.38)',
                transformOrigin: 'center center',
              } as React.CSSProperties}
            >

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
                <div className="text-center space-y-2 px-4">
                  <div className="text-3xl md:text-4xl lg:text-5xl">{card.icon}</div>
                  <div>
                    <p className="text-xs md:text-sm lg:text-sm font-semibold">{card.description}</p>
                    <p className="text-xs text-white/60 mt-0.5">Tap to unlock profile</p>
                  </div>
                  <div className="pt-2 border-t border-white/20">
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
                  idx === currentCard ? 'bg-green-500 w-8' : 'bg-gray-300 w-2 hover:bg-gray-400'
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
            <div className="absolute inset-0" style={{ background: design.face }} />

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
