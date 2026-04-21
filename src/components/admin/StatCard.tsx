import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  color?: 'blue' | 'green' | 'purple' | 'teal' | 'orange' | 'pink' | 'red';
  description?: string;
}

const colorConfig = {
  blue: {
    iconBg: 'bg-blue-500/10 border-blue-500/20',
    iconText: 'text-blue-400',
    trendBg: 'bg-blue-500/10',
  },
  green: {
    iconBg: 'bg-green-500/10 border-green-500/20',
    iconText: 'text-green-400',
    trendBg: 'bg-green-500/10',
  },
  purple: {
    iconBg: 'bg-purple-500/10 border-purple-500/20',
    iconText: 'text-purple-400',
    trendBg: 'bg-purple-500/10',
  },
  orange: {
    iconBg: 'bg-orange-500/10 border-orange-500/20',
    iconText: 'text-orange-400',
    trendBg: 'bg-orange-500/10',
  },
  teal: {
    iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    iconText: 'text-emerald-400',
    trendBg: 'bg-emerald-500/10',
  },
  pink: {
    iconBg: 'bg-pink-500/10 border-pink-500/20',
    iconText: 'text-pink-400',
    trendBg: 'bg-pink-500/10',
  },
  red: {
    iconBg: 'bg-red-500/10 border-red-500/20',
    iconText: 'text-red-400',
    trendBg: 'bg-red-500/10',
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
      className={`relative bg-gradient-to-br from-[#0f172a]/50 to-[#020617]/50 border border-white/10 rounded-lg p-6 
        hover:border-green-500/30 hover:bg-gradient-to-br hover:from-[#0f172a]/80 hover:to-[#020617]/80
        hover:shadow-[0_0_20px_rgba(74,222,128,0.15)]
        transition-all duration-300 group overflow-hidden`}
    >
      {/* Subtle gradient shimmer on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-400/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-lg" />

      <div className="relative flex items-start justify-between mb-4">
        {/* Label */}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</p>

        {/* Icon */}
        {icon && (
          <div className={`w-10 h-10 rounded-md border flex items-center justify-center flex-shrink-0 ${config.iconBg} ${config.iconText} transition-all duration-200`}>
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <p className="relative text-2xl sm:text-3xl font-bold text-white tracking-tight">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Trend or description */}
      <div className="relative mt-3 flex items-center gap-1.5">
        {trend ? (
          <>
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-1 rounded-md transition-colors duration-200 ${trend.isPositive
                ? 'text-green-400 bg-green-500/10'
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
