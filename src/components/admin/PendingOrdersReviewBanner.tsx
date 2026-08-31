import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface PendingOrdersReviewBannerProps {
  count: number;
}

/**
 * Purely presentational amber banner that surfaces the most actionable fact on
 * the dashboard. The caller decides whether to render it; this component does
 * not compute or fetch anything.
 */
export default function PendingOrdersReviewBanner({ count }: PendingOrdersReviewBannerProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[rgba(201,169,97,0.25)] bg-[rgba(201,169,97,0.07)] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
      <div className="flex items-start gap-3 sm:items-center">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[rgba(201,169,97,0.25)] bg-[rgba(201,169,97,0.10)] text-[var(--tv-brass)]">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--tv-text)]">
            <span className="tabular-nums">{count.toLocaleString()}</span>{' '}
            {count === 1 ? 'order is' : 'orders are'} awaiting review
          </p>
          <p className="mt-0.5 text-xs text-[var(--tv-text-muted)]">
            {count === 1
              ? 'This order has not been processed yet.'
              : 'These orders have not been processed yet.'}
          </p>
        </div>
      </div>

      <Link
        href="/admin/orders"
        className="group inline-flex flex-shrink-0 items-center justify-center gap-1.5 self-start rounded-lg border border-[rgba(201,169,97,0.30)] bg-[rgba(201,169,97,0.10)] px-3.5 py-2 text-xs font-semibold text-[var(--tv-brass)] transition-colors duration-200 hover:bg-[rgba(201,169,97,0.20)] hover:text-[var(--tv-brass)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,169,97,0.40)] sm:self-auto"
      >
        Review orders
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
