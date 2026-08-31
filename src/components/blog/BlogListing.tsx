import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import PostCard from '@/components/blog/PostCard';
import TagChips from '@/components/blog/TagChips';
import BlogCta from '@/components/blog/BlogCta';
import { listPublishedPosts, listPublishedTags } from '@/lib/blog/queries';
import { blogJsonLd, jsonLdScript } from '@/lib/blog/jsonld';
import { SITE_NAME } from '@/lib/site-config';

export const POSTS_PER_PAGE = 9;

export const BLOG_INTRO =
  'Guides and practical notes on NFC business cards, digital profiles and modern networking, from the team at Tapvyo.';

interface BlogListingProps {
  page: number;
  /** Set on a tag archive; absent on the main listing. */
  tag?: string;
}

/**
 * The listing body, shared by `/blog`, `/blog/page/[page]`, `/blog/tag/[tag]`
 * and `/blog/tag/[tag]/page/[page]`.
 *
 * Pagination lives in the path rather than a query string on purpose: a route
 * that reads `searchParams` is rendered dynamically on every request, which
 * would quietly turn the `revalidate = 60` on each of those pages into a
 * no-op. As path segments, every page of the listing is statically generated
 * and revalidated on a timer, and each one is its own crawlable URL.
 */
export default async function BlogListing({ page, tag }: BlogListingProps) {
  const [{ posts, totalPages, total }, tags] = await Promise.all([
    listPublishedPosts({ page, perPage: POSTS_PER_PAGE, tag }),
    listPublishedTags(),
  ]);

  // A tag archive with nothing in it is a 404, not an empty page: indexing one
  // would put a blank result in front of a searcher. The main listing keeps
  // its empty state, because "no posts yet" is a real state for a new blog.
  if (tag && posts.length === 0) notFound();
  // A page number past the end is equally not a page.
  if (page > 1 && posts.length === 0) notFound();

  const basePath = tag ? `/blog/tag/${encodeURIComponent(tag)}` : '/blog';
  const pageHref = (target: number) => (target === 1 ? basePath : `${basePath}/page/${target}`);

  // The newest post leads page one. On later pages a "featured" card would be
  // an arbitrarily enlarged post, so every card is the same size there.
  const featured = page === 1 && !tag ? posts[0] : undefined;
  const rest = featured ? posts.slice(1) : posts;

  return (
    <div className="frontend-dark">
      <Navbar />

      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(
            blogJsonLd(posts, basePath, tag ? `${SITE_NAME} posts tagged ${tag}` : `${SITE_NAME} Blog`)
          )}
        />

        <section className="tv-hero tv-page-head overflow-hidden pb-12 md:pb-16">
          <div className="site-container">
            {tag ? (
              <>
                <nav aria-label="Breadcrumb" className="mb-6">
                  <ol className="flex flex-wrap items-center gap-2">
                    <li>
                      <Link href="/blog" className="tv-mono tv-focus text-xs hover:text-[var(--tv-text)]">
                        Blog
                      </Link>
                    </li>
                    <li className="tv-mono text-xs" aria-hidden="true">/</li>
                    <li className="tv-mono text-xs text-[var(--tv-text)]" aria-current="page">{tag}</li>
                  </ol>
                </nav>
                <p className="tv-eyebrow">Tag</p>
                <h1 className="tv-display tv-measure-display">{tag}</h1>
                <p className="tv-lead tv-measure-lead mt-5">
                  {total} {total === 1 ? 'post' : 'posts'} tagged &ldquo;{tag}&rdquo;.
                </p>
              </>
            ) : (
              <>
                <p className="tv-eyebrow">Tapvyo Journal</p>
                <h1 className="tv-display tv-measure-display">Notes on tapping in.</h1>
                <p className="tv-lead tv-measure-lead mt-5">{BLOG_INTRO}</p>
              </>
            )}
          </div>
        </section>

        {tags.length > 0 && (
          <section className="tv-surface-ink tv-section-tight">
            <div className="site-container">
              <TagChips tags={tags} active={tag} />
            </div>
          </section>
        )}

        <section className="tv-surface-ink tv-section">
          <div className="site-container">
            {posts.length === 0 ? (
              <div className="tv-panel tv-panel-pad text-center">
                <h2 className="tv-h4 mb-2">Nothing published yet</h2>
                <p className="tv-small">The first post is on its way. Check back shortly.</p>
              </div>
            ) : (
              <>
                {featured && (
                  <div className="mb-10 md:mb-14">
                    <PostCard post={featured} featured priority />
                  </div>
                )}

                {rest.length > 0 && (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {rest.map((post, index) => (
                      <PostCard key={post.id} post={post} priority={!featured && index < 3} />
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <nav aria-label="Pagination" className="mt-12 flex items-center justify-center gap-3">
                    {page > 1 && (
                      <Link href={pageHref(page - 1)} className="tv-btn tv-btn-secondary tv-focus">
                        Previous
                      </Link>
                    )}
                    <span className="tv-mono text-sm">
                      Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link href={pageHref(page + 1)} className="tv-btn tv-btn-secondary tv-focus">
                        Next
                      </Link>
                    )}
                  </nav>
                )}
              </>
            )}
          </div>
        </section>

        <BlogCta />
      </main>

      <Footer />
    </div>
  );
}
