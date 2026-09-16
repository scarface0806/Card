import type { PostImageData } from '@/lib/blog/types';

/**
 * Shown whenever a post has no cover of its own.
 *
 * A card that simply dropped its media column when a post had no cover made the
 * listing ragged — some cards with art, some without, at different heights. A
 * branded plate keeps the grid even and is honest about what it is.
 */
export const BLOG_FALLBACK_COVER = '/blog-default.png';

/**
 * Below this, an alt string is treated as data entry noise rather than a
 * description. The live database has a cover captioned "ap"; two characters
 * describe nothing to a screen reader and nothing to an image crawler.
 */
const MIN_MEANINGFUL_ALT = 4;

/**
 * The alt text to render for a post's cover.
 *
 * Author-supplied alt wins whenever it is actually a description. This is the
 * render-time half of the fix: `scripts/fix-image-alts.ts` repairs the rows
 * already stored, and this stops the next bad row from reaching a reader. The
 * two are deliberately independent — cleaning the data does not make this
 * unnecessary, because nothing prevents a two-letter alt being typed tomorrow.
 */
export function coverAlt(alt: string | null | undefined, postTitle: string): string {
  const trimmed = (alt ?? '').trim();
  if (trimmed.length >= MIN_MEANINGFUL_ALT) return trimmed;
  return `Cover image for ${postTitle}`;
}

/** The cover to render, falling back to the branded plate. */
export function coverSrc(cover: PostImageData | null | undefined): string {
  return cover?.url || BLOG_FALLBACK_COVER;
}
