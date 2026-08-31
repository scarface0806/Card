import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowLeft, ArrowRight, Eye } from 'lucide-react';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import PostBody from '@/components/blog/PostBody';
import PostCard, { formatDate } from '@/components/blog/PostCard';
import TagChips from '@/components/blog/TagChips';
import TableOfContents from '@/components/blog/TableOfContents';
import ShareButtons from '@/components/blog/ShareButtons';
import ViewTracker from '@/components/blog/ViewTracker';
import BlogCta from '@/components/blog/BlogCta';
import {
  getAdjacentPosts,
  getPublishedPostBySlug,
  getRelatedPosts,
  listPublishedForFeeds,
  resolveSlugRedirect,
} from '@/lib/blog/queries';
import { buildToc } from '@/lib/blog/toc';
import { htmlToPlainText } from '@/lib/blog/sanitize';
import { jsonLdScript, postJsonLd } from '@/lib/blog/jsonld';
import { SITE_NAME, SITE_URL } from '@/lib/site-config';

export const revalidate = 60;

/** Off by default — the reader has no use for a view counter. */
const SHOW_PUBLIC_VIEW_COUNT = process.env.NEXT_PUBLIC_BLOG_SHOW_VIEWS === 'true';

type PageProps = { params: Promise<{ slug: string }> };

/**
 * Pre-render every published post at build time. A slug that is not in this
 * list - one published since the build, or a retired slug on its way to a
 * redirect - is still rendered on demand and then cached.
 */
export async function generateStaticParams() {
  const posts = await listPublishedForFeeds();
  return posts.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return { title: 'Post not found', robots: { index: false, follow: false } };
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt;
  const canonical = post.canonicalUrl || `/blog/${post.slug}`;
  const image = post.ogImage || post.coverImage?.url;

  return {
    title,
    description,
    alternates: { canonical },
    ...(post.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: 'article',
      siteName: SITE_NAME,
      locale: 'en_IN',
      url: `${SITE_URL}/blog/${post.slug}`,
      title: `${title} | ${SITE_NAME}`,
      description,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
      authors: [post.authorName],
      tags: post.tags,
      images: image
        ? [{ url: image, width: post.coverImage?.width ?? 1200, height: post.coverImage?.height ?? 630, alt: post.coverImage?.alt ?? title }]
        : [{ url: '/og-image.png', width: 1200, height: 630, alt: `${SITE_NAME} social preview` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image || `${SITE_URL}/og-image.png`],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    // A slug that used to belong to a live post is not a 404 — it is the same
    // article at a new address. Next issues 308, the method-preserving
    // equivalent of 301; search engines treat the two identically for
    // canonicalisation and link equity.
    const current = await resolveSlugRedirect(slug);
    if (current) permanentRedirect(`/blog/${current}`);

    notFound();
  }

  const { html, headings } = buildToc(post.content);
  const [related, { previous, next }] = await Promise.all([
    getRelatedPosts(post.id, post.tags, 3),
    getAdjacentPosts(post.id, post.publishedAt),
  ]);

  const postUrl = `${SITE_URL}/blog/${post.slug}`;

  return (
    <div className="frontend-dark">
      <Navbar />

      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(postJsonLd(post, htmlToPlainText(post.content)))}
        />
        <ViewTracker slug={post.slug} />

        <article>
          <header className="tv-hero tv-page-head overflow-hidden pb-10">
            <div className="site-container">
              <nav aria-label="Breadcrumb" className="mb-6">
                <ol className="flex flex-wrap items-center gap-2">
                  <li>
                    <Link href="/" className="tv-mono tv-focus text-xs hover:text-[var(--tv-text)]">Home</Link>
                  </li>
                  <li className="tv-mono text-xs" aria-hidden="true">/</li>
                  <li>
                    <Link href="/blog" className="tv-mono tv-focus text-xs hover:text-[var(--tv-text)]">Blog</Link>
                  </li>
                  <li className="tv-mono text-xs" aria-hidden="true">/</li>
                  <li className="tv-mono max-w-[40ch] truncate text-xs text-[var(--tv-text)]" aria-current="page">
                    {post.title}
                  </li>
                </ol>
              </nav>

              {post.tags.length > 0 && <p className="tv-eyebrow">{post.tags[0]}</p>}

              <h1 className="tv-display tv-measure-display">{post.title}</h1>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="tv-small">By {post.authorName}</span>
                {post.publishedAt && (
                  <>
                    <span className="tv-mono text-xs" aria-hidden="true">·</span>
                    <time dateTime={post.publishedAt} className="tv-mono text-xs">
                      {formatDate(post.publishedAt)}
                    </time>
                  </>
                )}
                <span className="tv-mono text-xs" aria-hidden="true">·</span>
                <span className="tv-mono text-xs">{post.readingTimeMinutes} min read</span>
                {SHOW_PUBLIC_VIEW_COUNT && (
                  <>
                    <span className="tv-mono text-xs" aria-hidden="true">·</span>
                    <span className="tv-mono inline-flex items-center gap-1.5 text-xs">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      {post.views.toLocaleString()} views
                    </span>
                  </>
                )}
              </div>
            </div>
          </header>

          {post.coverImage && (
            <div className="site-container mb-12 md:mb-16">
              <div className="tv-figure-media relative aspect-[16/9] overflow-hidden rounded-2xl">
                <Image
                  src={post.coverImage.url}
                  alt={post.coverImage.alt}
                  fill
                  // The only above-the-fold image on the page.
                  priority
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  className="object-cover"
                />
              </div>
            </div>
          )}

          <section className="tv-surface-ink tv-section-tight">
            <div className="site-container">
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-14">
                <div className="min-w-0">
                  <PostBody html={html} />

                  {post.tags.length > 0 && (
                    <div className="mt-12">
                      <TagChips tags={post.tags.map((tag) => ({ tag }))} showAll={false} />
                    </div>
                  )}

                  <div className="tv-rule my-8" />

                  <ShareButtons url={postUrl} title={post.title} />
                </div>

                {/* Source order puts the article first; the aside is pulled
                    above it on desktop only, so a screen reader and a narrow
                    viewport both reach the content without wading through a
                    contents list. */}
                <aside className="order-first lg:order-none">
                  <TableOfContents headings={headings} />
                </aside>
              </div>
            </div>
          </section>

          {(previous || next) && (
            <section className="tv-surface-graphite tv-section-tight">
              <div className="site-container">
                <nav aria-label="More posts" className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {previous ? (
                    <Link href={`/blog/${previous.slug}`} className="tv-panel tv-panel-pad tv-focus group">
                      <span className="tv-eyebrow mb-2 inline-flex items-center gap-2">
                        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                        Previous
                      </span>
                      <span className="tv-h4 block group-hover:text-[var(--tv-patina)]">{previous.title}</span>
                    </Link>
                  ) : (
                    <span />
                  )}

                  {next && (
                    <Link href={`/blog/${next.slug}`} className="tv-panel tv-panel-pad tv-focus group md:text-right">
                      <span className="tv-eyebrow mb-2 inline-flex items-center gap-2">
                        Next
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <span className="tv-h4 block group-hover:text-[var(--tv-patina)]">{next.title}</span>
                    </Link>
                  )}
                </nav>
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section className="tv-surface-ink tv-section">
              <div className="site-container">
                <h2 className="tv-h2 mb-8">Related reading</h2>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map((item) => (
                    <PostCard key={item.id} post={item} />
                  ))}
                </div>
              </div>
            </section>
          )}
        </article>

        <BlogCta />
      </main>

      <Footer />
    </div>
  );
}
