import { QrCode, ShieldCheck, Truck } from 'lucide-react';
import {
  DELIVERY_TEXT,
  QR_BACKUP_TEXT,
  REPLACEMENT_GUARANTEE_TEXT,
} from '@/lib/site-config';

/**
 * The three product promises - delivery time, the QR backup and the
 * replacement guarantee - as one compact list, for product listings and
 * checkout. Every line is read from site-config.ts so the catalogue, checkout,
 * FAQ and policy pages cannot drift apart.
 *
 * `show` picks a subset where a line already appears nearby.
 */
type Assurance = 'delivery' | 'qr' | 'guarantee';

const ROWS: Record<Assurance, { icon: typeof Truck; text: string }> = {
  delivery: { icon: Truck, text: DELIVERY_TEXT },
  qr: { icon: QrCode, text: QR_BACKUP_TEXT },
  guarantee: { icon: ShieldCheck, text: REPLACEMENT_GUARANTEE_TEXT },
};

export default function ProductAssurances({
  show = ['delivery', 'qr', 'guarantee'],
  className = '',
}: {
  show?: Assurance[];
  className?: string;
}) {
  return (
    <ul className={`space-y-2 ${className}`}>
      {show.map((key) => {
        const { icon: Icon, text } = ROWS[key];
        return (
          <li key={key} className="tv-small flex items-start gap-2">
            <Icon className="w-4 h-4 mt-[3px] shrink-0 text-[#C9A961]" aria-hidden="true" />
            <span>{text}</span>
          </li>
        );
      })}
    </ul>
  );
}
