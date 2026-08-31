'use client';

import React from 'react';
import type { ViewsPoint } from '@/lib/blog/types';

interface BlogViewsChartProps {
  series: ViewsPoint[];
}

/**
 * 30-day views chart.
 *
 * Plain CSS columns rather than a charting library — the repo has none, and
 * one bar chart does not justify adding one. Colours are the panel's own
 * tokens, so it sits inside the admin surface rather than on top of it.
 */
export default function BlogViewsChart({ series }: BlogViewsChartProps) {
  const peak = Math.max(1, ...series.map((point) => point.views));
  const total = series.reduce((sum, point) => sum + point.views, 0);

  return (
    <div className="tv-adm-panel">
      <div className="tv-adm-panel-head">
        <h3 className="tv-adm-panel-title">Views, last 30 days</h3>
        <span className="tv-adm-count">{total.toLocaleString()} total</span>
      </div>

      <div className="tv-adm-panel-pad">
        {total === 0 ? (
          <div className="tv-adm-empty">
            <p className="tv-adm-meta">No views recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="flex h-40 items-end gap-[3px]" role="img" aria-label={chartSummary(series, total)}>
              {series.map((point) => (
                <div
                  key={point.date}
                  className="tv-adm-chart-col"
                  // Zero days still get a hairline, so the axis reads as a
                  // continuous 30-day run rather than a gap.
                  style={{ height: `${Math.max(2, (point.views / peak) * 100)}%` }}
                  title={`${formatDay(point.date)} — ${point.views} view${point.views === 1 ? '' : 's'}`}
                />
              ))}
            </div>

            <div className="mt-2 flex justify-between">
              <span className="tv-adm-meta text-xs">{formatDay(series[0]?.date)}</span>
              <span className="tv-adm-meta text-xs">Peak {peak.toLocaleString()}</span>
              <span className="tv-adm-meta text-xs">{formatDay(series[series.length - 1]?.date)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatDay(date: string | undefined): string {
  if (!date) return '';
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/** The chart is decorative markup; this is what a screen reader gets instead. */
function chartSummary(series: ViewsPoint[], total: number): string {
  const best = series.reduce((a, b) => (b.views > a.views ? b : a), series[0]);
  return `${total} views over the last ${series.length} days. Busiest day ${formatDay(best?.date)} with ${best?.views ?? 0}.`;
}
