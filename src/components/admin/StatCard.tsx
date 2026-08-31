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
 * Restrained semantic palette, now drawn from the site tokens. Mirrors
 * StatusBadge so the stat row and the table badges speak the same language:
 *   patina  → primary / positive metric
 *   neutral → inactive, disabled, zero-state
 *   brass   → pending / needs attention
 *   danger  → error
 * Nothing else is allowed on screen.
 */
const tone = {
  patina: 'tv-adm-stat-icon--patina',
  neutral: '',
  brass: 'tv-adm-stat-icon--brass',
  danger: 'tv-adm-stat-icon--danger',
} as const;

/**
 * The public `color` values are unchanged for prop compatibility, but each one
 * resolves onto one of the four semantic tones above — so no off-system colour
 * can reach the screen regardless of what a caller passes.
 */
const colorConfig: Record<NonNullable<StatCardProps['color']>, string> = {
  green: tone.patina,
  teal: tone.patina,
  blue: tone.neutral,
  purple: tone.neutral,
  pink: tone.neutral,
  orange: tone.brass,
  red: tone.danger,
};

export default function StatCard({
  label,
  value,
  icon,
  trend,
  color = 'blue',
  description,
}: StatCardProps) {
  const iconTone = colorConfig[color];

  return (
    // No hover treatment: these cards have no click handler, so they must not
    // advertise interactivity.
    <div className="tv-adm-stat">
      {/* Label + icon. min-h-8 keeps the row a fixed height whether or not an
          icon is passed, so every value below sits on the same baseline. */}
      <div className="flex min-h-8 items-center justify-between gap-3">
        <p className="tv-adm-label truncate">{label}</p>

        {icon && <div className={`tv-adm-stat-icon ${iconTone}`}>{icon}</div>}
      </div>

      {/* Value */}
      <p className="tv-adm-stat-value mt-3">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>

      {/* Fixed-height subtitle slot — rendered even when empty so that numbers
          share one baseline across the whole row. */}
      <div className="mt-2.5 flex h-5 items-center gap-1.5">
        {trend ? (
          <>
            <span
              className={`tv-adm-badge !px-1.5 !py-0.5 ${
                trend.isPositive ? 'tv-adm-badge--patina' : 'tv-adm-badge--danger'
              }`}
            >
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend.value)}%
            </span>
            <span className="tv-adm-meta text-xs">vs last month</span>
          </>
        ) : description ? (
          <p className="tv-adm-meta text-xs">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
