import type { Metadata } from 'next';
import BlogListing from '@/components/blog/BlogListing';
import { listPublishedTags } from '@/lib/blog/queries';
import { pageMetadata } from '@/lib/page-metadata';
import { SITE_NAME } from '@/lib/site-config';

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

  return pageMetadata({
    title: `${tag} posts`,
    description: `Every ${SITE_NAME} article tagged "${tag}" — guides and notes on NFC cards, digital profiles and networking.`,
    path: `/blog/tag/${encodeURIComponent(tag)}`,
  });
}

export default async function BlogTagPage({ params }: PageProps) {
  return <BlogListing page={1} tag={readTag((await params).tag)} />;
}
