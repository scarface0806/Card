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
    <div className="flex h-full flex-col rounded-xl border border-white/[0.12] bg-gradient-to-b from-[#0f172a] to-[#020617] p-5">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
          Total Customers
        </p>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-green-500/25 bg-green-500/10 text-green-400">
          <Users className="h-4 w-4" />
        </div>
      </div>

      {/* Primary figure */}
      <p className="mt-3 text-[28px] font-bold leading-none tracking-tight text-white tabular-nums">
        {total.toLocaleString()}
      </p>

      {/* Sub-stats occupy the same fixed-height slot StatCard reserves for its
          subtitle. Green = active (positive), neutral grey = disabled. */}
      <div className="mt-2.5 flex h-5 items-center gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#9ca3af]">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-400" />
          <span className="font-semibold text-white tabular-nums">{active.toLocaleString()}</span>
          active
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-[#9ca3af]">
          <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-500" />
          <span className="font-semibold text-white tabular-nums">{disabled.toLocaleString()}</span>
          disabled
        </span>
      </div>
    </div>
  );
}
