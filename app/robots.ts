import type { MetadataRoute } from 'next';
import { CANONICAL_ORIGIN } from '@/lib/site-config';

/**
 * CANONICAL_ORIGIN, not SITE_URL — the sitemap URL and `host` here are read by
 * crawlers, so they name the real domain regardless of how a deployment is
 * configured.
 *
 * Nothing that affects how a page is rendered or indexed is blocked. In
 * particular /favicon.ico and /_next/image stay crawlable: Google fetches the
 * favicon as a separate request when it builds a result snippet, and blocking
 * the image optimiser hides every image on the site from Google Images.
 *
 * The disallowed paths below are private or post-checkout surfaces. They are
 * kept out of the sitemap too; the two lists must not disagree.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api/',
          '/dashboard',
          '/create-card',
          '/my-orders',
          '/order-success',
          '/unauthorized',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/blog/preview/',
          '/cgi-bin/',
        ],
      },
    ],
    sitemap: `${CANONICAL_ORIGIN}/sitemap.xml`,
    host: CANONICAL_ORIGIN,
  };
}
