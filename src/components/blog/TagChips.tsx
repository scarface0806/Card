import Link from 'next/link';

interface TagChipsProps {
  tags: { tag: string; count?: number }[];
  /** The tag currently being filtered on, if any. */
  active?: string;
  /** Where "All" points. */
  allHref?: string;
  showAll?: boolean;
}

/**
 * Tag filter chips. Real links to the tag archives rather than client-side
 * filter state, so each filtered view is its own indexable URL.
 */
export default function TagChips({ tags, active, allHref = '/blog', showAll = true }: TagChipsProps) {
  if (tags.length === 0) return null;

  return (
    <nav aria-label="Filter posts by tag" className="tv-tag-row">
      {showAll && (
        <Link
          href={allHref}
          aria-current={active ? undefined : 'page'}
          className={`tv-tag tv-focus ${active ? '' : 'tv-tag-patina'}`}
        >
          All posts
        </Link>
      )}

      {tags.map(({ tag, count }) => (
        <Link
          key={tag}
          href={`/blog/tag/${encodeURIComponent(tag)}`}
          aria-current={active === tag ? 'page' : undefined}
          className={`tv-tag tv-focus ${active === tag ? 'tv-tag-patina' : ''}`}
        >
          {tag}
          {typeof count === 'number' && <span className="tv-mono ml-1.5 text-[0.7em]">{count}</span>}
        </Link>
      ))}
    </nav>
  );
}
