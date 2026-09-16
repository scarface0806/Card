import { listPublishedTags } from '@/lib/blog/queries';

/**
 * How many published posts a tag needs before its archive page is worth
 * indexing.
 *
 * With four posts and six tags, most tag pages listed one or two articles that
 * already appear on /blog and on each other's pages. To a crawler those read as
 * near-duplicates of the listing rather than as pages in their own right, and a
 * pile of thin archives dilutes the handful of pages that actually deserve to
 * rank.
 *
 * A thin tag page is still useful to a reader who clicks the chip, so it stays
 * live and linked — it is `noindex, follow` rather than removed. `follow`
 * matters: the crawler should still walk through to the posts it lists.
 *
 * The threshold lifts itself as the blog grows. Nothing needs editing when a
 * tag reaches its third post; the next build simply includes it.
 */
export const MIN_POSTS_FOR_INDEXABLE_TAG = 3;

export function isIndexableTag(postCount: number): boolean {
  return postCount >= MIN_POSTS_FOR_INDEXABLE_TAG;
}

/**
 * Post count for one tag, or 0 when the tag has no published posts.
 *
 * Reads through the same cached query the listing uses, so asking this during
 * generateMetadata costs no extra database round trip.
 */
export async function publishedPostCountForTag(tag: string): Promise<number> {
  const tags = await listPublishedTags();
  return tags.find((entry) => entry.tag === tag)?.count ?? 0;
}
