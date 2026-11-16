import { ShieldCheck } from 'lucide-react';
import { REPLACEMENT_GUARANTEE_TEXT } from '@/lib/site-config';

/**
 * One-line trust row for next to a "Get your card" CTA. Text and window come
 * from site-config.ts; the full terms are section 5 of /refund-policy.
 *
 * Inherits colour from the surrounding `tv-small`, so it reads correctly on
 * both the ink and bone surfaces; only the icon carries the brass accent.
 */
export default function ReplacementGuarantee({ className = '' }: { className?: string }) {
  return (
    <p className={`tv-small flex items-center gap-2 ${className}`}>
      <ShieldCheck className="w-4 h-4 shrink-0 text-[#C9A961]" aria-hidden="true" />
      {REPLACEMENT_GUARANTEE_TEXT}
    </p>
  );
}
