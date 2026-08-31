import React from 'react';
import { Users } from 'lucide-react';

interface CustomerMetricsCardProps {
  total: number;
  active: number;
  disabled: number;
}

/**
 * Purely presentational. Groups the three customer counts into one card so the
 * stat row divides evenly, with Total as the primary figure and Active /
 * Disabled as sub-stats. Geometry is kept identical to StatCard (p-5, min-h-8
 * label row, mt-3 value, h-5 subtitle slot) so every number in the row shares
 * one baseline.
 */
export default function CustomerMetricsCard({ total, active, disabled }: CustomerMetricsCardProps) {
  return (
    // No hover treatment: no click handler exists, so no interactive affordance.
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-slate)] p-5">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--tv-text-muted)]">
          Total Customers
        </p>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[rgba(76,174,137,0.25)] bg-[rgba(76,174,137,0.10)] text-[var(--tv-patina)]">
          <Users className="h-4 w-4" />
        </div>
      </div>

      {/* Primary figure */}
      <p className="mt-3 text-[28px] font-bold leading-none tracking-tight text-[var(--tv-text)] tabular-nums">
        {total.toLocaleString()}
      </p>

      {/* Sub-stats occupy the same fixed-height slot StatCard reserves for its
          subtitle. Green = active (positive), neutral grey = disabled. */}
      <div className="mt-2.5 flex h-5 items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--tv-text-muted)]">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--tv-patina)]" />
          <span className="font-semibold text-[var(--tv-text)] tabular-nums">{active.toLocaleString()}</span>
          active
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--tv-text-muted)]">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--tv-text-muted)]" />
          <span className="font-semibold text-[var(--tv-text)] tabular-nums">{disabled.toLocaleString()}</span>
          disabled
        </span>
      </div>
    </div>
  );
}
