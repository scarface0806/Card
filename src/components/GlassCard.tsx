import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  interactive?: boolean;
}

/**
 * Premium glassmorphism card component
 * Features subtle blur, border, and hover effects
 */
export default function GlassCard({
  children,
  className = '',
  hover = false,
  glow = false,
  interactive = false,
}: GlassCardProps) {
  const baseClasses = [
    'relative',
    'bg-white/5',
    'backdrop-blur-xl',
    'border border-white/10',
    'rounded-2xl',
    'shadow-glass',
    'p-6 md:p-8',
    interactive && 'cursor-pointer',
    hover && 'hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 ease-out',
    glow && 'hover:shadow-glow-md hover:border-white/20',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={baseClasses}>
      {glow && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/5 pointer-events-none" />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
