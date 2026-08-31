import type { Metadata } from 'next';
import BlogListing, { BLOG_INTRO } from '@/components/blog/BlogListing';
import { pageMetadata } from '@/lib/page-metadata';

/** Published posts change rarely; a minute of staleness is a fair trade. */
export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: 'Blog',
  description: BLOG_INTRO,
  path: '/blog',
});

export default function BlogIndexPage() {
  return <BlogListing page={1} />;
}
