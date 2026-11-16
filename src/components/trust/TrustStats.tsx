import { TRUST_STATS, type TrustStat } from '@/lib/site-config';

/**
 * Social-proof strip, driven by TRUST_STATS in site-config.ts.
 *
 * A stat with an empty value is skipped rather than shown as a placeholder, and
 * the whole strip renders nothing when no stat has a value. That is the point:
 * the site must never show a number nobody has checked. It replaced a hardcoded
 * "4.9/5 · Trusted by 10,000+ professionals" line that had no source.
 */
export default function TrustStats({
  stats = TRUST_STATS,
  className = '',
}: {
  stats?: TrustStat[];
  className?: string;
}) {
  const filled = stats.filter((stat) => stat.value.trim() !== '');
  if (filled.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-baseline gap-x-6 gap-y-3 ${className}`}>
      {filled.map((stat) => (
        <li key={stat.label} className="flex items-baseline gap-2">
          <span className="tv-mono !text-[#F1F3F1] !tracking-[0.08em]">{stat.value}</span>
          <span className="tv-small">{stat.label}</span>
        </li>
      ))}
    </ul>
  );
}
