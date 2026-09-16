import type { Metadata } from 'next';
import BlogListing from '@/components/blog/BlogListing';
import { listPublishedTags } from '@/lib/blog/queries';
import { pageMetadata } from '@/lib/page-metadata';
import { SITE_NAME } from '@/lib/site';
import { isIndexableTag, publishedPostCountForTag } from '@/lib/blog/tag-indexing';

export const revalidate = 60;

type PageProps = { params: Promise<{ tag: string }> };

export function readTag(raw: string): string {
  return decodeURIComponent(raw).trim().toLowerCase();
}

export async function generateStaticParams() {
  const tags = await listPublishedTags();
  return tags.map(({ tag }) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tag = readTag((await params).tag);
  const count = await publishedPostCountForTag(tag);

  const base = pageMetadata({
    title: `${tag} posts`,
    description: `Every ${SITE_NAME} article tagged "${tag}" — guides and notes on NFC cards, digital profiles and networking.`,
    path: `/blog/tag/${encodeURIComponent(tag)}`,
  });

  // A tag with only one or two posts is a near-copy of /blog and of the other
  // thin tag archives. It stays live and linked for a reader who clicks the
  // chip, but it is kept out of the index.
  //
  // `follow: true`, not pageMetadata's `noindex` flag, which pairs noindex with
  // nofollow. The posts listed here are exactly what the crawler should walk
  // through to; only this archive page is not worth indexing.
  if (!isIndexableTag(count)) {
    return { ...base, robots: { index: false, follow: true } };
  }

  return base;
}

export default async function BlogTagPage({ params }: PageProps) {
  return <BlogListing page={1} tag={readTag((await params).tag)} />;
}
