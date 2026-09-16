import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import type { PostSummary } from '@/lib/blog/types';
import { coverAlt, coverSrc } from '@/lib/blog/images';

interface PostCardProps {
  post: PostSummary;
  /** The lead card on the listing: wider, larger type, and eager-loaded. */
  featured?: boolean;
  /** True only for images above the fold, which must not be lazy. */
  priority?: boolean;
}

/**
 * One post on the listing. Server component — no interactivity beyond the
 * link, so none of this ships to the browser as JavaScript.
 */
export default function PostCard({ post, featured = false, priority = false }: PostCardProps) {
  // Every card gets media now. A post with no cover of its own falls back to
  // the branded plate rather than dropping the column: half the published
  // posts have no cover, and a listing where some cards carry art and others
  // start at the headline reads as broken rather than as a choice.
  const cover = post.coverImage;
  const src = coverSrc(cover);
  const alt = coverAlt(cover?.alt, post.title);

  return (
    <article
      className={
        featured
          ? 'tv-panel overflow-hidden md:grid md:grid-cols-2'
          : 'tv-panel flex flex-col overflow-hidden'
      }
    >
      <Link
        href={`/blog/${post.slug}`}
        className="tv-focus group block overflow-hidden"
        tabIndex={-1}
        aria-hidden="true"
      >
        {/* 16/9 at every breakpoint, matching the post hero, so a cover is
            cropped the same way wherever it appears. The stored covers are 3:2,
            so object-center decides what survives the crop — centre rather than
            the default, which would bias toward the top of the frame. */}
        <div className={`tv-blog-media relative overflow-hidden ${featured ? 'aspect-[16/9] h-full' : 'aspect-[16/9]'}`}>
          <Image
            src={src}
            alt={alt}
            fill
            // Featured spans half the container on desktop, cards a third.
            sizes={featured ? '(max-width: 768px) 100vw, 50vw' : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
          />
        </div>
      </Link>

      <div className={`flex flex-1 flex-col ${featured ? 'p-6 md:p-8' : 'p-5'}`}>
        {post.tags.length > 0 && (
          <p className="tv-eyebrow mb-3">{post.tags[0]}</p>
        )}

        <h3 className={featured ? 'tv-h3 mb-3' : 'tv-h4 mb-2'}>
          <Link href={`/blog/${post.slug}`} className="tv-focus transition-colors hover:text-[var(--tv-patina)]">
            {post.title}
          </Link>
        </h3>

        <p className="tv-small tv-measure-body mb-5 flex-1">{post.excerpt}</p>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {post.publishedAt && (
            <time dateTime={post.publishedAt} className="tv-mono text-xs">
              {formatDate(post.publishedAt)}
            </time>
          )}
          <span className="tv-mono text-xs" aria-hidden="true">·</span>
          <span className="tv-mono text-xs">{post.readingTimeMinutes} min read</span>

          <Link
            href={`/blog/${post.slug}`}
            className="tv-focus ml-auto inline-flex items-center gap-1 text-sm text-[var(--tv-patina)] hover:text-[#6FC4A5]"
          >
            Read
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">: {post.title}</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
