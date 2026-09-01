'use client';

import { useSearchParams } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

import {
  SELECTED_PRODUCT_MESSAGES,
  type SelectedProductFailure,
} from '@/lib/products/selection';

/**
 * The message /create-card redirects here with when it cannot resolve a
 * product: `?notice=missing | not-found | inactive | not-purchasable`.
 *
 * Checkout deliberately refuses to render a default-priced card, so this is
 * where the customer is told to pick again. The wording lives in one place next
 * to the failure reasons, so it cannot drift from the checks that produce it.
 *
 * Kept as its own component, rendered inside a <Suspense> boundary, so that
 * useSearchParams only opts THIS subtree out of static prerendering instead of
 * the whole catalogue page.
 */
export default function SelectionNotice() {
  const searchParams = useSearchParams();
  const notice = searchParams.get('notice');

  if (!notice || !(notice in SELECTED_PRODUCT_MESSAGES)) {
    return null;
  }

  const message = SELECTED_PRODUCT_MESSAGES[notice as SelectedProductFailure];

  return (
    <div role="status" className="tv-notice tv-notice-warn mb-8">
      <AlertTriangle className="tv-notice-icon w-4 h-4" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
