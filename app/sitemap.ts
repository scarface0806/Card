import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site-config';

/**
 * Public routes only. Admin, API, auth and post-checkout pages are excluded
 * here and in robots.ts.
 */
const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/cards', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/create-card', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/services', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/products', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/how-to-use', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/about-us', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact-us', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/preview-website', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms-conditions', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
