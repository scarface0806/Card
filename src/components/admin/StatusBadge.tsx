import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';
  label?: string;
}

/**
 * Four tones drawn from the site palette: patina for live and done, brass for
 * waiting, neutral for dormant, danger for stopped. The status set and the
 * labels are unchanged.
 */
const statusConfig: Record<StatusBadgeProps['status'], string> = {
  active: 'tv-adm-badge--patina',
  completed: 'tv-adm-badge--patina',
  pending: 'tv-adm-badge--brass',
  inactive: 'tv-adm-badge--neutral',
  cancelled: 'tv-adm-badge--danger',
};

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const toneClass = statusConfig[status];
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`tv-adm-badge ${toneClass}`}>
      <span className="relative flex h-1.5 w-1.5">
        {/* Only "active" pulses — it is the one status that means something is
            live right now. motion-reduce drops it. */}
        {status === 'active' && (
          <span className="tv-adm-badge-dot absolute inline-flex h-full w-full animate-pulse opacity-75 motion-reduce:hidden" />
        )}
        <span className="tv-adm-badge-dot relative inline-flex" />
      </span>
      {displayLabel}
    </span>
  );
}
