'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, Loader2, PackageSearch, Truck } from 'lucide-react';

import Input from '@/components/Input';
import { PHONE_DISPLAY, SUPPORT_EMAIL, WHATSAPP_NUMBER } from '@/lib/site-config';
import { logFetchError } from '@/lib/fetch-utils';

type TrackingStage = 'placed' | 'printing' | 'shipped' | 'delivered';

interface TrackedOrder {
  orderRef: string;
  stage: TrackingStage;
  cancelled: boolean;
  timestamps: Record<TrackingStage, string | null>;
  courierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  expectedDeliveryFrom: string | null;
  expectedDeliveryTo: string | null;
}

const STAGES: { key: TrackingStage; label: string; blurb: string }[] = [
  { key: 'placed', label: 'Placed', blurb: 'We have your order' },
  { key: 'printing', label: 'Printing', blurb: 'Your card is in production' },
  { key: 'shipped', label: 'Shipped', blurb: 'Handed to the courier' },
  { key: 'delivered', label: 'Delivered', blurb: 'Tap and go' },
];

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

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function deliveryWindow(order: TrackedOrder): string | null {
  const from = formatDate(order.expectedDeliveryFrom);
  const to = formatDate(order.expectedDeliveryTo);
  if (from && to) return `${from} to ${to}`;
  if (to) return `By ${to}`;
  if (from) return `From ${from}`;
  return null;
}

export default function TrackOrderClient({ initialRef }: { initialRef: string }) {
  // Prefilled from ?ref= in the confirmation email. The mobile number is still
  // required - a forwarded email must not be enough to open someone's order.
  const [ref, setRef] = useState(initialRef);
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      const response = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref, mobile }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.success) {
        // Whatever the server said is shown verbatim. It deliberately does not
        // distinguish a wrong reference from a wrong mobile number.
        setError(
          payload?.message || "We couldn't find an order matching those details."
        );
        return;
      }

      setOrder(payload.order as TrackedOrder);
    } catch (fetchError) {
      logFetchError('Track order lookup failed:', fetchError);
      setError('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentIndex = order ? STAGES.findIndex((s) => s.key === order.stage) : -1;
  const window = order ? deliveryWindow(order) : null;

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="tv-panel tv-panel-pad space-y-5">
        <Input
          label="Order reference"
          placeholder="ORD-XXXX-XXXX"
          value={ref}
          onChange={(event) => setRef(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          required
          hint="On your order confirmation email."
        />
        <Input
          label="Mobile number"
          type="tel"
          inputMode="tel"
          placeholder="98765 43210"
          value={mobile}
          onChange={(event) => setMobile(event.target.value)}
          autoComplete="tel"
          required
          hint="The number you gave at checkout. Spaces, dashes and +91 are fine."
        />

        <button
          type="submit"
          disabled={loading || !ref.trim() || !mobile.trim()}
          className="tv-btn tv-btn-primary tv-btn-lg tv-btn-block"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <PackageSearch className="w-4 h-4" />
              Track my order
            </>
          )}
        </button>

        {error && (
          <p role="alert" className="tv-form-error">
            {error}
          </p>
        )}
      </form>

      {order && (
        <div className="tv-panel tv-panel-pad space-y-6">
          <div>
            <p className="tv-mono mb-1">Order reference</p>
            <p className="text-2xl font-bold text-white font-mono tracking-widest break-all">
              {order.orderRef}
            </p>
          </div>

          {order.cancelled && (
            <p role="status" className="tv-form-error">
              This order was cancelled. Contact us if that is unexpected.
            </p>
          )}

          {!order.cancelled && (
            <ol className="space-y-0">
              {STAGES.map((stage, index) => {
                const done = index <= currentIndex;
                const isCurrent = index === currentIndex;
                const stamp = formatDateTime(order.timestamps[stage.key]);

                return (
                  <li key={stage.key} className="flex gap-4 pb-6 last:pb-0">
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
                      {index < STAGES.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={`w-px flex-1 mt-1 ${done ? 'bg-primary/60' : 'bg-white/15'}`}
                        />
                      )}
                    </div>
                    <div className="pb-1">
                      <p
                        className={`font-semibold ${done ? 'text-white' : 'text-white/45'}`}
                      >
                        {stage.label}
                        {isCurrent && (
                          <span className="ml-2 text-primary text-xs uppercase tracking-wider">
                            Current
                          </span>
                        )}
                      </p>
                      <p className="tv-small">{stage.blurb}</p>
                      {stamp && <p className="tv-small mt-0.5">{stamp}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {(order.courierName || order.trackingNumber || window) && (
            <div className="border-t border-white/10 pt-5 space-y-3">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" aria-hidden="true" />
                Courier
              </h2>
              {order.courierName && (
                <p className="tv-small">
                  <span className="text-white/60">Carrier: </span>
                  <span className="text-white">{order.courierName}</span>
                </p>
              )}
              {order.trackingNumber && (
                <p className="tv-small">
                  <span className="text-white/60">Tracking number: </span>
                  <span className="text-white font-mono">{order.trackingNumber}</span>
                </p>
              )}
              {window && (
                <p className="tv-small">
                  <span className="text-white/60">Expected delivery: </span>
                  <span className="text-white">{window}</span>
                </p>
              )}
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline break-all tv-small"
                >
                  Track with the courier
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <div className="border-l-2 border-[#C9A961] pl-5 py-1 space-y-2">
        <h2 className="font-semibold text-white">Cannot find your order?</h2>
        <p className="tv-small">
          Email{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">
            {SUPPORT_EMAIL}
          </a>{' '}
          or WhatsApp{' '}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            {PHONE_DISPLAY}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
