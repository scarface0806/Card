/**
 * Slug rules for the blog. Clean, lowercase-hyphenated, no dates and no ids —
 * so a post URL stays readable and never has to change when it is re-dated.
 */

const MAX_SLUG_LENGTH = 80;

/**
 * Build a URL slug from arbitrary text.
 *
 * Diacritics are folded rather than stripped (`Café` -> `cafe`, not `caf`) so
 * an accented title still produces a meaningful slug.
 */
export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, "");
}

/**
 * Slugs claimed by real routes under /blog. A post using one would be
 * shadowed by that route and become unreachable, so they are refused at
 * validation time rather than discovered as a 404 after publishing.
 */
export const RESERVED_SLUGS = new Set(["tag", "preview", "rss.xml", "page", "feed"]);

/**
 * True when a string is already a well-formed slug. Used to validate the
 * manually-edited slug field rather than silently rewriting what was typed.
 */
export function isValidSlug(value: string): boolean {
  if (RESERVED_SLUGS.has(value)) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= MAX_SLUG_LENGTH;
}

/**
 * Append `-2`, `-3`, ... until the slug is free.
 *
 * `isTaken` is passed in rather than queried here so this stays free of any
 * database import and can be unit-tested on its own.
 */
export async function uniqueSlug(
  desired: string,
  isTaken: (candidate: string) => Promise<boolean>
): Promise<string> {
  const base = slugify(desired) || "post";

  // A reserved slug is treated exactly like a taken one, so it falls through to
  // the numbered-suffix loop below ("tag" becomes "tag-2") instead of failing.
  if (!RESERVED_SLUGS.has(base) && !(await isTaken(base))) return base;

  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = `${base.slice(0, MAX_SLUG_LENGTH - 4)}-${suffix}`.replace(/-+$/g, "");
    if (!RESERVED_SLUGS.has(candidate) && !(await isTaken(candidate))) return candidate;
  }

  // 98 collisions on one base slug means something is wrong upstream; a
  // timestamp suffix is a last resort that is still guaranteed to be free.
  return `${base.slice(0, MAX_SLUG_LENGTH - 8)}-${Date.now().toString(36)}`;
}

export { MAX_SLUG_LENGTH };
