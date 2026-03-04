import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';
  label?: string;
}

const statusConfig = {
  active: {
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-500/20',
    glow: 'shadow-emerald-500/20',
  },
  inactive: {
    bg: 'bg-gray-500/15',
    text: 'text-gray-400',
    dot: 'bg-gray-400',
    ring: 'ring-gray-500/20',
    glow: 'shadow-gray-500/10',
  },
  pending: {
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    ring: 'ring-amber-500/20',
    glow: 'shadow-amber-500/20',
  },
  completed: {
    bg: 'bg-blue-500/15',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    ring: 'ring-blue-500/20',
    glow: 'shadow-blue-500/20',
  },
  cancelled: {
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    dot: 'bg-red-400',
    ring: 'ring-red-500/20',
    glow: 'shadow-red-500/20',
  },
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${config.bg} ${config.text} ${config.ring}`}
    >
      <span className={`relative flex h-1.5 w-1.5`}>
        {status === 'active' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-60`} />
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
      </span>
      {displayLabel}
    </span>
  );
}
