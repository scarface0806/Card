'use client';

import { motion } from 'framer-motion';
import { Wifi } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface BulkCardProps {
  icon: LucideIcon;
  title: string;
  features: string[];
  cardGradient?: string;
  onContactClick: () => void;
  accentColor?: 'blue' | 'gray' | 'green';
  description?: string;
}

export default function BulkCard({
  icon: Icon,
  title,
  features,
  cardGradient = 'linear-gradient(145deg, #2C3134 0%, #171B1D 45%, #0A0C0D 100%)',
  onContactClick,
  accentColor = 'gray',
  description,
}: BulkCardProps) {
  // Each variant gets a distinct edge tint so the three panels are
  // differentiated by material rather than by three shades of the same glow.
  const edgeMap = {
    blue: 'rgba(94, 150, 190, 0.30)',
    gray: 'rgba(201, 169, 97, 0.30)',
    green: 'rgba(76, 174, 137, 0.30)',
  };

  const edge = edgeMap[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
      className="tv-panel tv-panel-pad flex flex-col h-full"
    >
      {/* Card visual */}
      <div className="mb-7">
        <div
          className="relative w-full aspect-[1.7/1] max-w-[260px] rounded-xl overflow-hidden"
          style={{
            background: cardGradient,
            boxShadow: `0 18px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.16), 0 0 0 1px ${edge}`,
          }}
        >
          <div className="absolute top-3 right-3">
            <Wifi className="w-4 h-4 text-white/45 rotate-45" aria-hidden="true" />
          </div>
          <div className="absolute top-3 left-3 w-7 h-7 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-white/75" aria-hidden="true" />
          </div>
          <div className="absolute bottom-4 left-4 right-4 space-y-1.5">
            <div className="h-1.5 bg-white/30 rounded w-2/3" />
            <div className="h-1.5 bg-white/15 rounded w-2/5" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col grow">
        <h3 className="tv-h4 mb-2">{title}</h3>

        {description && <p className="tv-small mb-6">{description}</p>}

        {/* Spec sheet rather than a bulleted feature list with tick circles. */}
        <ul className="tv-spec grow mb-7">
          {features.map((feature, idx) => (
            <li key={idx} className="tv-spec-row">
              {feature}
            </li>
          ))}
        </ul>

        <button onClick={onContactClick} className="tv-btn tv-btn-secondary w-full mt-auto">
          Talk to our team
        </button>
      </div>
    </motion.div>
  );
}
