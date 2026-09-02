import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { pageMetadata } from '@/lib/page-metadata';
import { getSelectedProduct } from '@/lib/products/selected-product';
import { getSessionUser, loginRedirect } from '@/lib/session';

import CreateCardClient from './CreateCardClient';

export const metadata: Metadata = pageMetadata({
  title: 'Create Your Digital Card',
  description:
    'Design and order your NFC business card in five steps. Enter your details, pick a template and check out - free lifetime digital profile included.',
  path: '/create-card',
});

/**
 * Server component so the page has real markup in the initial HTML.
 *
 * This used to be a `'use client'` page that read `useSearchParams()` inside a
 * `<Suspense>` boundary. On a statically prerendered route that triggers Next's
 * client-side-rendering bailout: the entire boundary is skipped on the server,
 * so the shipped HTML was nothing but a loading spinner and the main conversion
 * path was invisible to crawlers and to anyone on a slow connection.
 *
 * WHERE THE PRICE COMES FROM
 * The product is read from the database by id, here on the server, and handed
 * down as the single source of truth for name, price, tier, image, description
 * and features. It used to be resolved against a hardcoded array of card tiers
 * that fell back to "Modern Minimalist, 599" for any slug it did not
 * recognise - which was every admin-created product.
 *
 * A missing, unknown, inactive or unpriced product redirects to /cards with a
 * message. It deliberately never renders a default-priced card: showing one
 * price and charging another is worse than showing nothing.
 *
 * SIGN-IN REQUIRED. proxy.ts already redirects an anonymous visitor here to
 * /login, so this check is the second layer rather than the first. It matters
 * because the middleware gate is a path list that can drift, and because this
 * page is the entry point to the paid flow - it should never render for a
 * visitor the order API is going to refuse anyway.
 */
export default async function CreateCardPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string | string[]; template?: string | string[] }>;
}) {
  const params = await searchParams;

  // Preserve the product choice across the login round-trip. Redirecting to
  // a bare /login and back to a bare /create-card would silently discard the
  // card the customer picked on /cards.
  const user = await getSessionUser();
  if (!user) {
    const query = new URLSearchParams();
    const productId = Array.isArray(params.productId) ? params.productId[0] : params.productId;
    const template = Array.isArray(params.template) ? params.template[0] : params.template;
    if (productId) query.set("productId", productId);
    if (template) query.set("template", template);
    const suffix = query.toString() ? `?${query.toString()}` : "";
    redirect(loginRedirect(`/create-card${suffix}`));
  }

  const first = (value?: string | string[]) =>
    Array.isArray(value) ? value[0] : value;

  const result = await getSelectedProduct({
    productId: first(params.productId),
    // Legacy links used ?template=<slug>. Resolved against real products now,
    // not against a hardcoded list.
    slug: first(params.template),
  });

  if (!result.ok) {
    redirect(`/cards?notice=${result.reason}`);
  }

  return <CreateCardClient product={result.product} />;
}
