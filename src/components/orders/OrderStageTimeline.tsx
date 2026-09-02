'use client';

/**
 * ORDER STAGE TIMELINE
 *
 * The five-stage vertical timeline shown on /my-orders and
 * /my-orders/[orderId]. Markup is lifted from the existing public tracker
 * (app/track-order/TrackOrderClient.tsx) so a customer sees the same shape
 * whether they track an order by reference or from their account - only the
 * stage list differs, and that comes from src/lib/order-stages.ts.
 *
 * A cancelled order does NOT render a timeline. Drawing a progress track for
 * an order that stopped would imply it is still moving.
 */

import { CheckCircle2, Circle } from 'lucide-react';

import { ORDER_STAGES, stageIndex, type OrderStage } from '@/lib/order-stages';

interface OrderStageTimelineProps {
  stage: OrderStage;
  cancelled: boolean;
  timestamps: Record<OrderStage, string | null>;
}

/**
 * Formatted on the client only.
 *
 * Order data arrives by fetch after mount, so this never runs during server
 * rendering and cannot produce a locale or timezone hydration mismatch - the
 * trap that `new Date().toLocaleDateString()` at module scope in a client
 * component falls into.
 */
function formatDateTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function OrderStageTimeline({
  stage,
  cancelled,
  timestamps,
}: OrderStageTimelineProps) {
  if (cancelled) {
    return (
      <p role="status" className="tv-form-error">
        This order was cancelled. Contact us if that is unexpected.
      </p>
    );
  }

  const currentIndex = stageIndex(stage);

  return (
    <ol className="space-y-0">
      {ORDER_STAGES.map((entry, index) => {
        const done = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const stamp = formatDateTime(timestamps[entry.key]);

        return (
          <li key={entry.key} className="flex gap-4 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              {done ? (
                <CheckCircle2
                  className="w-6 h-6 text-primary flex-shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <Circle
                  className="w-6 h-6 text-white/25 flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              {index < ORDER_STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`w-px flex-1 mt-1 ${done ? 'bg-primary/60' : 'bg-white/15'}`}
                />
              )}
            </div>
            <div className="pb-1">
              <p className={`font-semibold ${done ? 'text-white' : 'text-white/45'}`}>
                {entry.label}
                {isCurrent && (
                  <span className="ml-2 text-primary text-xs uppercase tracking-wider">
                    Current
                  </span>
                )}
              </p>
              <p className="tv-small">{entry.blurb}</p>
              {stamp && <p className="tv-small mt-0.5">{stamp}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
