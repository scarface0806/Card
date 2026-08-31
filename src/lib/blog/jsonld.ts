import { SITE_NAME, SITE_URL } from "@/lib/site-config";
import type { PostDetail, PostSummary } from "@/lib/blog/types";

/** Absolute URL for a path, as every structured-data field requires. */
function absolute(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path}`;
}

/**
 * BlogPosting + BreadcrumbList for a single post, emitted as one @graph so the
 * two nodes can reference each other rather than repeating the publisher.
 */
export function postJsonLd(post: PostDetail, plainTextBody: string) {
  const url = absolute(`/blog/${post.slug}`);
  const image = post.ogImage || post.coverImage?.url;

  const blogPosting = {
    "@type": "BlogPosting",
    "@id": `${url}#post`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    url,
    ...(image ? { image: [image] } : {}),
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    author: { "@type": "Person", name: post.authorName },
    publisher: { "@id": `${SITE_URL}/#organization` },
    ...(post.tags.length > 0 ? { keywords: post.tags.join(", ") } : {}),
    ...(post.category ? { articleSection: post.category } : {}),
    // Google uses this to sanity-check that the marked-up article is the page's
    // actual content, so it comes from the rendered body, not the excerpt.
    wordCount: plainTextBody.split(/\s+/).filter(Boolean).length,
    inLanguage: "en",
  };

  const breadcrumb = {
    "@type": "BreadcrumbList",
    "@id": `${url}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  return { "@context": "https://schema.org", "@graph": [blogPosting, breadcrumb] };
}

/** `Blog` for the listing page, with the posts currently on it. */
export function blogJsonLd(posts: PostSummary[], path = "/blog", name = `${SITE_NAME} Blog`) {
  const url = absolute(path);

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${url}#blog`,
    url,
    name,
    publisher: { "@id": `${SITE_URL}/#organization` },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      "@id": `${absolute(`/blog/${post.slug}`)}#post`,
      headline: post.title,
      description: post.excerpt,
      url: absolute(`/blog/${post.slug}`),
      datePublished: post.publishedAt ?? undefined,
      author: { "@type": "Person", name: post.authorName },
      ...(post.coverImage ? { image: [post.coverImage.url] } : {}),
    })),
  };
}

/**
 * Render a JSON-LD script tag. Every value passed in originates from our own
 * database and constants, never from a request.
 */
export function jsonLdScript(data: unknown) {
  return { __html: JSON.stringify(data) };
}
