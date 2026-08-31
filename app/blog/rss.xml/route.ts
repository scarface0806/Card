import { listPublishedForFeeds } from "@/lib/blog/queries";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/site-config";

export const runtime = "nodejs";

/** Matches the pages' own cache window. */
export const revalidate = 60;

/** The five characters that are not legal as raw text inside an XML node. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * GET /blog/rss.xml
 *
 * Excerpts only, not full bodies: the feed is a way in, and a summary keeps it
 * small enough to stay cheap to regenerate every minute.
 */
export async function GET() {
  const posts = await listPublishedForFeeds();
  const feedUrl = `${SITE_URL}/blog/rss.xml`;
  const updated = posts[0]?.updatedAt ?? new Date();

  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const published = (post.publishedAt ?? post.updatedAt).toUTCString();

      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        `      <description>${escapeXml(post.excerpt)}</description>`,
        `      <pubDate>${published}</pubDate>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(`${SITE_NAME} Blog`)}</title>`,
    `    <link>${SITE_URL}/blog</link>`,
    `    <description>${escapeXml(SITE_DESCRIPTION)}</description>`,
    "    <language>en-in</language>",
    `    <lastBuildDate>${updated.toUTCString()}</lastBuildDate>`,
    `    <managingEditor>${escapeXml(SUPPORT_EMAIL)} (${escapeXml(SITE_NAME)})</managingEditor>`,
    `    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
