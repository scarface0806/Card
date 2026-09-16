import { pageMetadata } from '@/lib/page-metadata';

/**
 * Metadata only. The page below is a client component and so cannot export
 * `metadata` itself - a segment layout is the supported way to give a client
 * route its own title, description and canonical URL.
 *
 * Without this the route inherited the root layout wholesale, which meant an
 * access-denied screen that declared itself indexable and canonical to `/` —
 * pointing Google at the homepage from a page that is not the homepage.
 *
 * noindex rather than just a robots.txt disallow: a disallowed URL can still be
 * indexed from an inbound link, because a crawler that may not fetch the page
 * never sees the tag telling it to stay out. Both, so neither has to be right
 * on its own.
 */
export const metadata = pageMetadata({
  title: 'Access Denied',
  description: 'You do not have permission to view this page.',
  path: '/unauthorized',
  noindex: true,
});

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
