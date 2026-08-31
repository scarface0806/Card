import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import PostBody from '@/components/blog/PostBody';
import TableOfContents from '@/components/blog/TableOfContents';
import { formatDate } from '@/components/blog/PostCard';
import { getPostByIdForPreview } from '@/lib/blog/queries';
import { buildToc } from '@/lib/blog/toc';
import { verifyPreviewToken } from '@/lib/blog/tokens';

/** A preview must always show the post as it stands right now. */
export const dynamic = 'force-dynamic';

/**
 * A draft is unpublished work. It must never be indexed, whatever the token.
 */
export const metadata: Metadata = {
  title: 'Draft preview',
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function BlogPreviewPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { token } = await searchParams;

  // Wrong or missing token behaves exactly like a non-existent page: an
  // unauthenticated visitor learns nothing about whether the draft exists.
  if (!verifyPreviewToken(id, token)) notFound();

  const post = await getPostByIdForPreview(id);
  if (!post) notFound();

  const { html, headings } = buildToc(post.content);

  return (
    <div className="frontend-dark">
      <Navbar />

      <main>
        <div className="tv-profilebar tv-profilebar--demo">
          <div className="site-container flex flex-wrap items-center justify-between gap-3 py-3">
            <p className="tv-small">
              <span className="tv-tag tv-tag-brass mr-2">Preview</span>
              {post.status === 'PUBLISHED' ? 'This post is published.' : 'This is an unpublished draft.'}
            </p>
            <Link href={`/admin/blogs/${post.id}/edit`} className="tv-small tv-focus hover:text-[#F1F3F1]">
              Edit post
            </Link>
          </div>
        </div>

        <article>
          <header className="tv-hero tv-page-head overflow-hidden pb-10">
            <div className="site-container">
              {post.tags.length > 0 && <p className="tv-eyebrow">{post.tags[0]}</p>}
              <h1 className="tv-display tv-measure-display">{post.title}</h1>
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="tv-small">By {post.authorName}</span>
                {post.publishedAt && (
                  <time dateTime={post.publishedAt} className="tv-mono text-xs">
                    {formatDate(post.publishedAt)}
                  </time>
                )}
                <span className="tv-mono text-xs">{post.readingTimeMinutes} min read</span>
              </div>
            </div>
          </header>

          <section className="tv-surface-ink tv-section-tight">
            <div className="site-container">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-14">
                <div className="min-w-0">
                  <PostBody html={html} />
                </div>
                <aside className="order-first lg:order-none">
                  <TableOfContents headings={headings} />
                </aside>
              </div>
            </div>
          </section>
        </article>
      </main>

      <Footer />
    </div>
  );
}
