import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'red';
  description?: string;
}

const colorConfig = {
  blue: {
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    iconText: 'text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  green: {
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconText: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  purple: {
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    iconText: 'text-purple-400',
    glow: 'shadow-purple-500/10',
  },
  orange: {
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    iconText: 'text-orange-400',
    glow: 'shadow-orange-500/10',
  },
  pink: {
    iconBg: 'bg-pink-500/10 border-pink-500/20',
    iconText: 'text-pink-400',
    glow: 'shadow-pink-500/10',
  },
  red: {
    iconBg: 'bg-red-500/10 border-red-500/20',
    iconText: 'text-red-400',
    glow: 'shadow-red-500/10',
  },
};

export default function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'blue',
  description,
}: StatCardProps) {
  const config = colorConfig[color];

  return (
    <div
      className={`relative bg-[#161b2e] border border-white/5 rounded-xl p-6 
        hover:-translate-y-0.5 hover:shadow-xl hover:border-white/10 
        transition-all duration-200 group overflow-hidden`}
    >
      {/* Subtle gradient shimmer on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

      <div className="flex items-start justify-between mb-4">
        {/* Label */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>

        {/* Icon */}
        {icon && (
          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${config.iconBg} ${config.iconText}`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <p className="text-3xl font-bold text-white tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Trend or description */}
      <div className="mt-3 flex items-center gap-1.5">
        {trend ? (
          <>
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md ${trend.isPositive
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-red-400 bg-red-500/10'
              }`}>
              {trend.isPositive
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-gray-600">vs last month</span>
          </>
        ) : description ? (
          <p className="text-xs text-gray-600">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
