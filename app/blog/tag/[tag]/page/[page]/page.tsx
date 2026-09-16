import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogListing from '@/components/blog/BlogListing';
import { pageMetadata } from '@/lib/page-metadata';
import { SITE_NAME } from '@/lib/site';
import { isIndexableTag, publishedPostCountForTag } from '@/lib/blog/tag-indexing';

export const revalidate = 60;

type PageProps = { params: Promise<{ tag: string; page: string }> };

function readTag(raw: string): string {
  return decodeURIComponent(raw).trim().toLowerCase();
}

function readPage(raw: string): number | null {
  // Page one is the tag archive itself, so `/page/1` would duplicate it.
  return /^[2-9]\d{0,3}$/.test(raw) ? Number(raw) : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag: rawTag, page: rawPage } = await params;
  const tag = readTag(rawTag);
  const page = readPage(rawPage);

  if (!page) return { title: `${tag} posts`, robots: { index: false, follow: false } };

  const base = pageMetadata({
    title: `${tag} posts — page ${page}`,
    description: `Every ${SITE_NAME} article tagged "${tag}", page ${page}.`,
    path: `/blog/tag/${encodeURIComponent(tag)}/page/${page}`,
  });

  // The same threshold as page one. Without it, noindexing /blog/tag/x would
  // just leave /blog/tag/x/page/2 as an indexable way into the same thin
  // archive. (A tag below the threshold cannot fill two pages today, but the
  // rule should not depend on that staying true.)
  if (!isIndexableTag(await publishedPostCountForTag(tag))) {
    return { ...base, robots: { index: false, follow: true } };
  }

  return base;
}

export default async function BlogTagPaginatedPage({ params }: PageProps) {
  const { tag: rawTag, page: rawPage } = await params;
  const page = readPage(rawPage);
  if (!page) notFound();

  return <BlogListing page={page} tag={readTag(rawTag)} />;
}
