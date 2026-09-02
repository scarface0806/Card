'use client';

/**
 * ORDER CARD - one order on /my-orders, and the header block on the detail page.
 *
 * READ-ONLY BY DESIGN. There is no edit control anywhere in here. A customer
 * who needs a printed detail changed uses "Request a change", which opens
 * WhatsApp prefilled with their Order ID so the team can make the change - the
 * profile editor is explicitly out of scope.
 */

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, Truck } from 'lucide-react';

import { PHONE_DISPLAY, SITE_URL, whatsappLink } from '@/lib/site-config';
import { formatPrice } from '@/utils/formatPrice';
import type { MyOrderSummary } from '@/lib/my-orders';

import OrderStageTimeline from './OrderStageTimeline';

interface OrderCardProps {
  order: MyOrderSummary;
  /**
   * The list page links each card through to its detail page; the detail page
   * renders the same card without a link back to itself.
   */
  showDetailLink?: boolean;
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

function deliveryWindow(order: MyOrderSummary): string | null {
  const from = formatDate(order.expectedDeliveryFrom);
  const to = formatDate(order.expectedDeliveryTo);
  if (from && to) return `${from} to ${to}`;
  if (to) return `By ${to}`;
  if (from) return `From ${from}`;
  return null;
}

/** Payment status drives the badge tint; nothing else keys off it. */
function paymentTone(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === 'PAID') return 'tv-tag tv-tag-patina';
  if (normalized === 'REFUNDED') return 'tv-tag tv-tag-brass';
  return 'tv-tag';
}

export default function OrderCard({ order, showDetailLink = true }: OrderCardProps) {
  const [copied, setCopied] = useState(false);

  const profileUrl = order.profilePath ? `${SITE_URL}${order.profilePath}` : null;
  const window_ = deliveryWindow(order);

  const copyProfileUrl = async () => {
    if (!profileUrl) return;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused (insecure context, permissions). The
      // URL is displayed beside the button, so it stays selectable by hand.
    }
  };

  return (
    <div className="tv-panel tv-panel-pad space-y-6">
      {/* Identity: the artwork they bought, and the reference they quote. */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        {/* Plain <img>, not next/image, and deliberately so. This URL is
            Order.productImageUrl - a snapshot of whatever the admin set on the
            product, from any host. next/image throws at runtime for a host
            missing from images.remotePatterns, which would break a customer's
            order page because of an artwork URL; <img> renders it regardless.
            The other profile views use <img> here for the same reason, and
            carry the same lint warning rather than a suppression. */}
        {order.designThumbnailUrl ? (
          <img
            src={order.designThumbnailUrl}
            alt={order.designName ? `${order.designName} card design` : 'Card design'}
            width={160}
            height={100}
            loading="lazy"
            decoding="async"
            className="w-full sm:w-40 h-auto rounded-xl border border-white/10 object-cover shrink-0"
          />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="tv-mono mb-1">Order reference</p>
          <p className="text-xl font-bold text-white font-mono tracking-widest break-all mb-3">
            {order.orderRef}
          </p>

          <p className="font-semibold text-white">
            {order.designName || 'NFC Card'}
          </p>
          {order.productTier ? (
            <p className="tv-small">{order.productTier}</p>
          ) : null}

          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <div>
              <dt className="tv-mono">Order date</dt>
              <dd className="tv-small text-white">{formatDate(order.placedAt)}</dd>
            </div>
            <div>
              <dt className="tv-mono">Amount paid</dt>
              <dd className="tv-small text-white">{formatPrice(order.amountPaid)}</dd>
            </div>
            <div>
              <dt className="tv-mono">Payment</dt>
              <dd className="mt-1">
                <span className={paymentTone(order.paymentStatus)}>
                  {order.paymentStatus}
                </span>
              </dd>
            </div>
            <div>
              <dt className="tv-mono">Order status</dt>
              <dd className="mt-1">
                <span className="tv-tag">{order.status}</span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Status timeline */}
      <div className="border-t border-white/10 pt-5">
        <h3 className="font-semibold text-white mb-4">Progress</h3>
        <OrderStageTimeline
          stage={order.stage}
          cancelled={order.cancelled}
          timestamps={order.timestamps}
        />
      </div>

      {/* Courier block - only once there is something real to show. The public
          tracker had a truthiness bug here (it tested `window`, the global,
          which is always truthy in a browser, so the block rendered empty). */}
      {(order.courierName || order.trackingNumber || window_) && (
        <div className="border-t border-white/10 pt-5 space-y-3">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" aria-hidden="true" />
            Courier
          </h3>
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
          {window_ && (
            <p className="tv-small">
              <span className="text-white/60">Expected delivery: </span>
              <span className="text-white">{window_}</span>
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

      {/* Live profile */}
      <div className="border-t border-white/10 pt-5 space-y-3">
        <h3 className="font-semibold text-white">Your live profile</h3>

        {profileUrl ? (
          <>
            <p className="tv-small font-mono break-all text-white">{profileUrl}</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => void copyProfileUrl()}
                className="tv-btn tv-btn-secondary tv-btn-block sm:!w-auto"
              >
                {copied ? (
                  <Check className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Copy className="w-4 h-4" aria-hidden="true" />
                )}
                {copied ? 'Link copied' : 'Copy link'}
              </button>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="tv-btn tv-btn-secondary tv-btn-block sm:!w-auto"
              >
                <ExternalLink className="w-4 h-4" aria-hidden="true" />
                View
              </a>
            </div>
            <span role="status" aria-live="polite" className="sr-only">
              {copied ? 'Profile link copied to clipboard' : ''}
            </span>
          </>
        ) : (
          <p className="tv-small">
            Your profile link appears here as soon as we set up your card. We
            email it to you as well.
          </p>
        )}
      </div>

      {/* Actions. "Request a change" is how a printed detail gets corrected -
          there is no self-serve editor, by design. */}
      <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row gap-3">
        <a
          href={whatsappLink(
            `Hi, I would like to request a change to my Tapvyo order ${order.orderRef}.`
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="tv-btn tv-btn-primary tv-btn-block sm:!w-auto"
        >
          <MessageCircle className="w-4 h-4" aria-hidden="true" />
          Request a change
          <span className="sr-only"> (opens WhatsApp in a new tab)</span>
        </a>

        {showDetailLink && (
          <Link
            href={`/my-orders/${order.id}`}
            className="tv-btn tv-btn-secondary tv-btn-block sm:!w-auto"
          >
            View full details
          </Link>
        )}
      </div>

      <p className="tv-small">
        Changes are made by our team on WhatsApp ({PHONE_DISPLAY}) so nothing
        already in production gets altered by accident.
      </p>
    </div>
  );
}
