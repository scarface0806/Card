import type { MetadataRoute } from 'next';
import { SEO_ORIGIN } from '@/lib/site';
import { listPublishedForFeeds, listPublishedTags, listPublishedPosts } from '@/lib/blog/queries';
import { isIndexableTag, MIN_POSTS_FOR_INDEXABLE_TAG } from '@/lib/blog/tag-indexing';

/**
 * Public routes only. Admin, API, auth and post-checkout pages are excluded
 * here and in robots.ts.
 *
 * PRIORITY is a relative ranking WITHIN this sitemap, not a request for better
 * placement. Seven pages previously sat at 1.0, which told a crawler nothing:
 * if everything is top priority, the field carries no signal at all. The scale
 * below descends from the homepage through conversion pages, content, and
 * finally the legal pages nobody searches for.
 *
 * NO lastModified. These pages change when someone edits their source, and the
 * sitemap has no way to know when that was — it previously stamped every one
 * with the build timestamp, so all thirteen appeared to change on every deploy.
 * Google discounts a lastmod that behaves like that, and a discounted lastmod
 * is worth less than none. Blog posts below DO carry one, because there the
 * date is real.
 */
const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },

  // The buy flow.
  //
  // CAUTION: /create-card is listed in `protectedRoutes` in proxy.ts, so an
  // anonymous request — Googlebot included — is 307'd to /login. Search Console
  // will report this entry as "Page with redirect" and will not index it. Its
  // metadata is clean (no noindex); the gate is what stops it. Removing
  // "/create-card" from that array in proxy.ts is what makes this entry
  // resolvable; order creation stays protected either way, because
  // `protectedApiRoutes` gates /api/orders and the payment routes separately.
  { path: '/create-card', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/cards', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/products', priority: 0.9, changeFrequency: 'weekly' },

  { path: '/services', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/how-to-use', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/preview-website', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.8, changeFrequency: 'daily' },

  { path: '/about-us', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/contact-us', priority: 0.6, changeFrequency: 'monthly' },

  { path: '/track-order', priority: 0.4, changeFrequency: 'yearly' },

  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms-conditions', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/refund-policy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/shipping-policy', priority: 0.3, changeFrequency: 'yearly' },
];

/** Re-read at the same cadence as the blog pages themselves. */
export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SEO_ORIGIN}${path}`,
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
    url: `${SEO_ORIGIN}/blog/${post.slug}`,
    // The post's own last edit, not the build time — this is the field search
    // engines use to decide whether a recrawl is worth it.
    lastModified: post.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  // Only tags with enough posts to be a page in their own right. The rest stay
  // live and linked but are noindex — see src/lib/blog/tag-indexing.ts, which
  // the tag route reads from the same constant so the two cannot disagree.
  const indexableTags = tags.filter(({ count }) => isIndexableTag(count));

  const tagEntries: MetadataRoute.Sitemap = await Promise.all(
    indexableTags.map(async ({ tag }) => {
      // A tag archive is only as fresh as its newest post. Reusing the build
      // time here would reintroduce exactly the problem the static routes above
      // just dropped lastModified to avoid. The listing is sorted newest-first,
      // so one row is enough.
      const { posts: tagged } = await listPublishedPosts({ page: 1, perPage: 1, tag });
      const newest = tagged[0]?.publishedAt;

      return {
        url: `${SEO_ORIGIN}/blog/tag/${encodeURIComponent(tag)}`,
        ...(newest ? { lastModified: new Date(newest) } : {}),
        changeFrequency: 'weekly' as const,
        priority: 0.4,
      };
    })
  );

  if (indexableTags.length < tags.length) {
    console.info(
      `[sitemap] ${tags.length - indexableTags.length} tag page(s) omitted: ` +
        `fewer than ${MIN_POSTS_FOR_INDEXABLE_TAG} published posts.`
    );
  }

  return [...staticEntries, ...postEntries, ...tagEntries];
}
