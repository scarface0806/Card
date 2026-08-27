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

/**
 * Restrained semantic palette. Mirrors StatusBadge so the stat row and the
 * table badges speak the same language:
 *   green   → primary / positive metric
 *   neutral → inactive, disabled, zero-state
 *   amber   → pending / needs attention
 *   red     → error
 * Nothing else is allowed on screen.
 */
const tone = {
  green: {
    iconBg: 'bg-green-500/10 border-green-500/25',
    iconText: 'text-green-400',
  },
  neutral: {
    iconBg: 'bg-white/[0.06] border-white/[0.12]',
    iconText: 'text-gray-400',
  },
  amber: {
    iconBg: 'bg-amber-500/10 border-amber-500/25',
    iconText: 'text-amber-400',
  },
  red: {
    iconBg: 'bg-red-500/10 border-red-500/25',
    iconText: 'text-red-400',
  },
} as const;

/**
 * The public `color` values are unchanged for prop compatibility, but each one
 * now resolves onto one of the four semantic tones above — so no off-system
 * colour can reach the screen regardless of what a caller passes.
 */
const colorConfig: Record<NonNullable<StatCardProps['color']>, (typeof tone)[keyof typeof tone]> = {
  green: tone.green,
  teal: tone.green,
  blue: tone.neutral,
  purple: tone.neutral,
  pink: tone.neutral,
  orange: tone.amber,
  red: tone.red,
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
    // No hover treatment: these cards have no click handler, so they must not
    // advertise interactivity.
    <div className="flex h-full flex-col rounded-xl border border-white/[0.12] bg-gradient-to-b from-[#0f172a] to-[#020617] p-5">
      {/* Label + icon. min-h-8 keeps the row a fixed height whether or not an
          icon is passed, so every value below sits on the same baseline. */}
      <div className="flex min-h-8 items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
          {label}
        </p>

        {icon && (
          <div
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border ${config.iconBg} ${config.iconText}`}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      <p className="mt-3 text-[28px] font-bold leading-none tracking-tight text-white tabular-nums">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Fixed-height subtitle slot — rendered even when empty so that numbers
          share one baseline across the whole row. */}
      <div className="mt-2.5 flex h-5 items-center gap-1.5">
        {trend ? (
          <>
            <span
              className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                trend.isPositive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-[#9ca3af]">vs last month</span>
          </>
        ) : description ? (
          <p className="text-xs text-[#9ca3af]">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
