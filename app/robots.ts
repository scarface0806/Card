import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Nothing behind auth, and nothing transactional, belongs in an index.
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/dashboard',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
          '/my-orders',
          '/order-success',
          '/unauthorized',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
