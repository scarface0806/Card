import type { MetadataRoute } from 'next';
import { CANONICAL_ORIGIN } from '@/lib/site-config';
import { listPublishedForFeeds, listPublishedTags } from '@/lib/blog/queries';

/**
 * Public routes only. Admin, API, auth and post-checkout pages are excluded
 * here and in robots.ts.
 */
const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/how-to-use', priority: 1.0, changeFrequency: 'monthly' },
  { path: '/cards', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/services', priority: 1.0, changeFrequency: 'monthly' },
  { path: '/about-us', priority: 1.0, changeFrequency: 'monthly' },
  { path: '/contact-us', priority: 1.0, changeFrequency: 'monthly' },
  { path: '/preview-website', priority: 1.0, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'daily' },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms-conditions', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/refund-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/shipping-policy', priority: 0.3, changeFrequency: 'yearly' },
];

const SITEMAP_ORIGIN = CANONICAL_ORIGIN;

/** Re-read at the same cadence as the blog pages themselves. */
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITEMAP_ORIGIN}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));

  // A blog table that is unreachable must not take the whole sitemap down with
  // it — the static routes above are the ones that matter most.
  let posts: Awaited<ReturnType<typeof listPublishedForFeeds>> = [];
  let tags: Awaited<ReturnType<typeof listPublishedTags>> = [];

  try {
    [posts, tags] = await Promise.all([listPublishedForFeeds(), listPublishedTags()]);
  } catch (error) {
    console.error('Sitemap: failed to read blog entries', error);
    return staticEntries;
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITEMAP_ORIGIN}/blog/${post.slug}`,
    // The post's own last edit, not the build time — this is the field search
    // engines use to decide whether a recrawl is worth it.
    lastModified: post.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map(({ tag }) => ({
    url: `${SITEMAP_ORIGIN}/blog/tag/${encodeURIComponent(tag)}`,
    lastModified,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries, ...tagEntries];
}
