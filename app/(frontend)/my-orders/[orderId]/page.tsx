'use client';

/**
 * ONE ORDER, EXPANDED.
 *
 * Everything the list card shows, plus the details the customer submitted at
 * checkout - rendered as READ-ONLY TEXT, never as form inputs. The customer
 * can see exactly what will be printed; they cannot change it here. That is
 * the whole point: an edit is a WhatsApp conversation with the team, because a
 * detail changed after the chip is encoded means a reprint.
 *
 * A 404 from the API covers both "no such order" and "not your order" - see
 * app/api/my-orders/[orderId]/route.ts for why those must be identical.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import OrderCard from '@/components/orders/OrderCard';
import { ROUTES } from '@/utils/constants';
import { formatPrice } from '@/utils/formatPrice';
import type { MyOrderDetail } from '@/lib/my-orders';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; order: MyOrderDetail }
  | { status: 'missing' }
  | { status: 'error'; message: string };

/** One read-only row. Renders nothing at all when there is no value. */
function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="tv-mono">{label}</dt>
      <dd className="tv-small text-white break-words">{value}</dd>
    </div>
  );
}

export default function MyOrderDetailPage() {
  const router = useRouter();
  // useParams rather than an async `params` prop: this is a client component,
  // so it never receives the server's params promise.
  const params = useParams<{ orderId: string }>();
  const orderId = params?.orderId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (!orderId) return;
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`/api/my-orders/${orderId}`, {
          signal: controller.signal,
          credentials: 'same-origin',
        });

        if (response.status === 401) {
          router.push(`${ROUTES.LOGIN}?redirect=/my-orders`);
          return;
        }

        if (response.status === 404) {
          setState({ status: 'missing' });
          return;
        }

        const payload = await response.json();

        if (!response.ok) {
          setState({
            status: 'error',
            message:
              payload.message || payload.error || 'We could not load this order.',
          });
          return;
        }

        setState({ status: 'ready', order: payload.order });
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        setState({
          status: 'error',
          message: 'We could not load this order. Please try again.',
        });
      }
    }

    void load();
    return () => controller.abort();
  }, [orderId, router]);

  return (
    <>
      <Navbar />
      <main className="tv-hero tv-page-head pb-20 min-h-screen">
        <div className="site-container">
          <Link
            href="/my-orders"
            className="tv-btn-tertiary !min-h-0 inline-flex items-center gap-2 mb-8"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            All orders
          </Link>

          {state.status === 'loading' && (
            <div className="tv-panel tv-panel-pad text-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4CAE89] border-t-transparent mx-auto mb-4" />
              <p className="tv-mono">Loading order</p>
            </div>
          )}

          {state.status === 'missing' && (
            <div className="tv-panel tv-panel-pad text-center py-14">
              <h1 className="tv-h3 mb-3">Order not found</h1>
              <p className="tv-body tv-measure-body mx-auto mb-8">
                We could not find that order on your account. Check the link, or
                pick the order from your list.
              </p>
              <Link href="/my-orders" className="tv-btn tv-btn-primary">
                Back to my orders
              </Link>
            </div>
          )}

          {state.status === 'error' && (
            <div className="tv-panel tv-panel-pad">
              <p role="alert" className="tv-form-error">
                {state.message}
              </p>
            </div>
          )}

          {state.status === 'ready' && (
            <div className="space-y-8">
              <h1 className="tv-h2">Order {state.order.orderRef}</h1>

              <OrderCard order={state.order} showDetailLink={false} />

              {/* What they submitted. Text, not inputs - see the file header. */}
              <div className="tv-panel tv-panel-pad space-y-5">
                <div>
                  <h2 className="tv-h3 mb-2">Details you submitted</h2>
                  <p className="tv-small">
                    This is exactly what we have on file for this order. To
                    change any of it, use &ldquo;Request a change&rdquo; above
                    and our team will update it for you.
                  </p>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-5">
                  <DetailRow label="Full name" value={state.order.submitted.name} />
                  <DetailRow label="Email" value={state.order.submitted.email} />
                  <DetailRow label="Mobile" value={state.order.submitted.phone} />
                  <DetailRow
                    label="Designation"
                    value={state.order.submitted.designation}
                  />
                  <DetailRow label="Company" value={state.order.submitted.company} />
                  <DetailRow label="Website" value={state.order.submitted.website} />
                  <div className="sm:col-span-2">
                    <DetailRow
                      label="Delivery address"
                      value={state.order.submitted.address}
                    />
                  </div>
                </dl>
              </div>

              {/* Payment breakdown */}
              <div className="tv-panel tv-panel-pad space-y-5">
                <h2 className="tv-h3">Payment</h2>

                {state.order.items.length > 0 && (
                  <ul className="space-y-2 border-t border-white/10 pt-5">
                    {state.order.items.map((item, index) => (
                      <li key={index} className="tv-summary-row">
                        <span className="tv-summary-key">
                          {item.productName}
                          {item.quantity > 1 ? ` x ${item.quantity}` : ''}
                        </span>
                        <span className="tv-summary-val">
                          {formatPrice(item.total)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="space-y-2 border-t border-white/10 pt-5">
                  <div className="tv-summary-row">
                    <span className="tv-summary-key">Subtotal</span>
                    <span className="tv-summary-val">
                      {formatPrice(state.order.subtotal)}
                    </span>
                  </div>
                  {state.order.discount > 0 && (
                    <div className="tv-summary-row">
                      <span className="tv-summary-key">Discount</span>
                      <span className="tv-summary-val">
                        -{formatPrice(state.order.discount)}
                      </span>
                    </div>
                  )}
                  <div className="tv-summary-row">
                    <span className="tv-summary-key">Shipping</span>
                    <span className="tv-summary-val-patina">
                      {state.order.shipping > 0
                        ? formatPrice(state.order.shipping)
                        : 'Included'}
                    </span>
                  </div>
                  {state.order.tax > 0 && (
                    <div className="tv-summary-row">
                      <span className="tv-summary-key">Tax</span>
                      <span className="tv-summary-val">
                        {formatPrice(state.order.tax)}
                      </span>
                    </div>
                  )}
                  <div className="tv-summary-total">
                    <span className="tv-summary-total-key">Total paid</span>
                    <span className="tv-summary-total-val">
                      {formatPrice(state.order.total)}
                    </span>
                  </div>
                </div>

                {state.order.paymentMethod && (
                  <p className="tv-small">
                    Paid by {state.order.paymentMethod}. Your card details are
                    handled by Razorpay and are never stored by Tapvyo.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
