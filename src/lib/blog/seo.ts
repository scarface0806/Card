import { SITE_NAME, SITE_URL } from "@/lib/site";

/**
 * SEO values derived from a post. One place, so the <head> tags, the JSON-LD
 * and the admin validation all apply the same rules.
 */

/** The post's own URL path — the same slug the route and the sitemap use. */
export function postPath(slug: string): string {
  return `/blog/${slug}`;
}

/**
 * The canonical for a post is ALWAYS its own URL.
 *
 * The stored `canonicalUrl` override is not consulted. It was free text, and
 * one post had been given a hand-typed slug that never existed, so the live
 * article declared a 404 as its canonical and asked Google to drop itself.
 * An override that equals the post's own URL changes nothing, and one that
 * differs is exactly the failure above, so there is no case where reading it
 * helps. New values are also refused at save time — see canonicalUrlError().
 */
export function postCanonical(slug: string): string {
  return postPath(slug);
}

/**
 * Why a submitted canonicalUrl is not acceptable for a post with this slug, or
 * null when it is fine. Empty is fine. Anything else must be the post's own
 * URL on the live domain — the only value that can never point at a page that
 * does not exist.
 */
export function canonicalUrlError(canonicalUrl: string | null | undefined, slug: string): string | null {
  const value = canonicalUrl?.trim();
  if (!value) return null;

  const expected = `${SITE_URL}${postPath(slug)}`;
  try {
    const url = new URL(value);
    const normalized = `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
    if (normalized === expected) return null;
  } catch {
    // Fall through to the error below.
  }
  return `Canonical URL must be this post's own address (${expected}) or left empty.`;
}

/** " | Tapvyo", " - Tapvyo", " — Tapvyo" etc. at the end of a stored title. */
const BRAND_SUFFIX = new RegExp(`\\s*[|\\-–—:]\\s*${SITE_NAME}\\s*$`, "i");

/** Remove a trailing brand suffix; the root title template adds it back once. */
export function stripBrandSuffix(title: string): string {
  return title.replace(BRAND_SUFFIX, "").trim();
}

/**
 * True for a title that is just a slug with the hyphens turned into spaces:
 * "Apple pay india nfc what it means for your nfc card". Letters, digits and
 * single spaces only, and no capital after the first character.
 */
function looksLikeSlug(text: string): boolean {
  return /^[A-Za-z0-9][a-z0-9]*( [a-z0-9]+)+$/.test(text.trim());
}

/**
 * The human title for a post, without the brand suffix: the SEO title when it
 * is a real title, otherwise the post's own title.
 *
 * A metaTitle that looks like a slug is skipped when the post title does not —
 * that combination means the override was generated or pasted from a URL, and
 * the post title is the one an editor actually wrote.
 */
export function postSeoTitle(post: { title: string; metaTitle: string | null }): string {
  const meta = post.metaTitle?.trim();
  const useMeta = meta && !(looksLikeSlug(meta) && !looksLikeSlug(post.title));
  return stripBrandSuffix(useMeta ? meta : post.title);
}

/** Words that are not simply capitalised. */
const TAG_WORDS: Record<string, string> = {
  nfc: "NFC",
  qr: "QR",
  seo: "SEO",
  ios: "iOS",
  iphone: "iPhone",
  vcard: "vCard",
  b2b: "B2B",
  ai: "AI",
  diy: "DIY",
};

/** "business-cards" -> "Business Cards", "nfc" -> "NFC". */
export function tagLabel(tag: string): string {
  return tag
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => TAG_WORDS[word.toLowerCase()] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * BlogPosting `author`. A named person when the post's author field holds one;
 * the business itself when it is empty or just the brand name, which is what
 * every post defaulted to — "Person: Tapvyo" told Google a person was called
 * Tapvyo.
 */
export function postAuthorJsonLd(authorName: string | null | undefined) {
  const name = authorName?.trim();
  if (!name || name.toLowerCase() === SITE_NAME.toLowerCase()) {
    return { "@type": "Organization", "@id": `${SITE_URL}/#organization` };
  }
  return { "@type": "Person", name };
}
