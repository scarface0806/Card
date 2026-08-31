import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogListing, { BLOG_INTRO, POSTS_PER_PAGE } from '@/components/blog/BlogListing';
import { listPublishedPosts } from '@/lib/blog/queries';
import { pageMetadata } from '@/lib/page-metadata';

export const revalidate = 60;

type PageProps = { params: Promise<{ page: string }> };

function readPage(raw: string): number | null {
  // Page one is `/blog`, so `/blog/page/1` would be a duplicate of it.
  return /^[2-9]\d{0,3}$/.test(raw) ? Number(raw) : null;
}

/** Pre-render the pages that exist today; later ones are built on demand. */
export async function generateStaticParams() {
  const { totalPages } = await listPublishedPosts({ page: 1, perPage: POSTS_PER_PAGE });
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => ({
    page: String(index + 2),
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const page = readPage((await params).page);
  if (!page) return { title: 'Blog', robots: { index: false, follow: false } };

  return pageMetadata({
    title: `Blog — page ${page}`,
    description: BLOG_INTRO,
    path: `/blog/page/${page}`,
  });
}

export default async function BlogPaginatedPage({ params }: PageProps) {
  const page = readPage((await params).page);
  if (!page) notFound();

  return <BlogListing page={page} />;
}
