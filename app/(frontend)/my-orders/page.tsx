'use client';

/**
 * MY ORDERS - the customer's read-only dashboard.
 *
 * SCOPE, deliberately narrow: see what you bought and where it is. There is no
 * profile editor, no field-level edit form, no theme switcher, no image
 * re-upload and no analytics - all explicitly out of scope. Corrections happen
 * through the "Request a change" WhatsApp action on each card.
 *
 * Authorisation is server-side, in two independent places:
 *   1. proxy.ts bounces an unauthenticated request to /login before this page
 *      is ever served;
 *   2. /api/my-orders authenticates again and scopes the query by userId.
 * The second is the one that actually matters - the first is only there so the
 * customer gets a login screen instead of an empty page.
 *
 * The session cookie is httpOnly, so this page cannot read it. It asks
 * /api/auth/me instead, which is the point: the browser never needs the token.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PackageSearch } from 'lucide-react';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import OrderCard from '@/components/orders/OrderCard';
import { ROUTES } from '@/utils/constants';
import { PHONE_DISPLAY, SUPPORT_EMAIL, whatsappLink } from '@/lib/site-config';
import type { MyOrderSummary } from '@/lib/my-orders';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; orders: MyOrderSummary[] }
  | { status: 'error'; message: string };

export default function MyOrdersPage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    // AbortController so a fast navigation away does not leave a setState
    // firing against an unmounted component.
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch('/api/my-orders', {
          signal: controller.signal,
          // The auth cookie is httpOnly and same-origin; this is explicit so
          // the intent is obvious rather than relying on the default.
          credentials: 'same-origin',
        });

        if (response.status === 401) {
          router.push(`${ROUTES.LOGIN}?redirect=/my-orders`);
          return;
        }

        const payload = await response.json();

        if (!response.ok) {
          setState({
            status: 'error',
            message:
              payload.message || payload.error || 'We could not load your orders.',
          });
          return;
        }

        setState({ status: 'ready', orders: payload.orders || [] });
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') return;
        setState({
          status: 'error',
          message: 'We could not load your orders. Please try again.',
        });
      }
    }

    void load();
    return () => controller.abort();
  }, [router]);

  return (
    <>
      <Navbar />
      <main className="tv-hero tv-page-head pb-20 min-h-screen">
        <div className="site-container">
          <div className="mb-10">
            <h1 className="tv-h2 mb-3">My Orders</h1>
            <p className="tv-body tv-measure-body">
              Everything you have ordered, and exactly where it is.
            </p>
          </div>

          {state.status === 'loading' && (
            <div className="tv-panel tv-panel-pad text-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4CAE89] border-t-transparent mx-auto mb-4" />
              <p className="tv-mono">Loading your orders</p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="tv-panel tv-panel-pad space-y-4">
              <p role="alert" className="tv-form-error">
                {state.message}
              </p>
              <p className="tv-small">
                If this keeps happening, email{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="tv-btn-tertiary !min-h-0 !text-sm"
                >
                  {SUPPORT_EMAIL}
                </a>{' '}
                or WhatsApp{' '}
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tv-btn-tertiary !min-h-0 !text-sm"
                >
                  {PHONE_DISPLAY}
                </a>
                .
              </p>
            </div>
          )}

          {state.status === 'ready' && state.orders.length === 0 && (
            <div className="tv-panel tv-panel-pad text-center py-14">
              <PackageSearch
                className="w-10 h-10 mx-auto mb-5 text-[#C9A961]"
                aria-hidden="true"
              />
              <h2 className="tv-h3 mb-3">No orders yet</h2>
              <p className="tv-body tv-measure-body mx-auto mb-8">
                When you order a card it will show up here, with its production
                and delivery status.
              </p>
              <Link href={ROUTES.CARDS} className="tv-btn tv-btn-primary">
                Browse card designs
              </Link>
            </div>
          )}

          {state.status === 'ready' && state.orders.length > 0 && (
            <>
              <p className="tv-mono mb-5">
                {state.orders.length}{' '}
                {state.orders.length === 1 ? 'order' : 'orders'}
              </p>
              <div className="space-y-8">
                {state.orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
