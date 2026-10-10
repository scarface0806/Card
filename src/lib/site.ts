/**
 * The site's public address, in one obvious place.
 *
 *   import { SITE_URL, SITE_NAME } from '@/lib/site';
 *
 * SITE_URL here is the production origin, https://tapvyo.in, and nothing else.
 * It is NOT read from an environment variable and NOT derived from VERCEL_URL
 * (which is always the deployment's own *.vercel.app hostname). Use it for
 * anything a search engine or a social crawler reads: metadataBase, canonical
 * tags, og:url / og:image, the sitemap, robots.txt, JSON-LD and the RSS feed.
 *
 * ---------------------------------------------------------------------------
 * WHY NOT `process.env.NEXT_PUBLIC_SITE_URL ?? "https://tapvyo.in"`
 * ---------------------------------------------------------------------------
 * `??` only falls back when the variable is ABSENT. It was present — set to
 * `https://tapvyo-nfc-card.vercel.app` in the Vercel dashboard — so the
 * fallback never ran, and every page on tapvyo.in shipped a canonical tag
 * pointing at the old alias. Google believed the tag over the 308 redirect and
 * indexed the wrong host.
 *
 * The literal itself lives in site-config.ts as CANONICAL_ORIGIN (next.config.ts
 * reads it from there for the domain redirects) and is re-exported here, so
 * there is exactly one copy of it.
 *
 * `SITE_URL` exported from '@/lib/site-config' is a different thing: an
 * env-configurable origin for links the app hands out (emails, share sheets,
 * QR codes), which may legitimately be localhost during development.
 */
import {
  ADDRESS,
  CANONICAL_ORIGIN,
  FACEBOOK_URL,
  INSTAGRAM_URL,
  LINKEDIN_URL,
  PHONE_DISPLAY,
  PHONE_E164,
  SITE_NAME,
  SUPPORT_EMAIL,
} from '@/lib/site-config';

export { SITE_NAME, CANONICAL_ORIGIN } from '@/lib/site-config';

export const SITE_URL: string = CANONICAL_ORIGIN;

/**
 * Name, address, phone, email and social profiles (NAP) — the business record
 * search engines cross-check between the site, structured data and Google
 * Business Profile. Every page must show exactly these values.
 *
 * Each field is a REFERENCE to the constant in site-config.ts that defines it,
 * never a second copy of the literal, so the footer, contact page, policy
 * pages, emails and JSON-LD cannot drift apart. Change a value there.
 *
 * No street address or postal code: none has been confirmed, and a made-up
 * one in structured data is worse than none.
 */
export const BUSINESS = {
  name: SITE_NAME,
  url: SITE_URL,
  email: SUPPORT_EMAIL,
  /** For display only. Never use in an href. */
  phone: PHONE_DISPLAY,
  /** For `tel:` hrefs. */
  phoneHref: PHONE_E164,
  /** Schema.org `telephone` form: "+91-7871361025". */
  phoneSchema: `${PHONE_E164.slice(0, 3)}-${PHONE_E164.slice(3)}`,
  city: ADDRESS.city,
  state: ADDRESS.state,
  country: ADDRESS.country,
  countryCode: 'IN',
  addressDisplay: ADDRESS.full,
  socials: {
    instagram: INSTAGRAM_URL,
    facebook: FACEBOOK_URL,
    linkedin: LINKEDIN_URL,
  },
} as const;

/** Alias kept for existing imports (sitemap). Same value as SITE_URL. */
export const SEO_ORIGIN: string = CANONICAL_ORIGIN;

/**
 * Rewrites an absolute *.vercel.app URL onto SITE_URL, keeping path, query and
 * hash. Anything else is returned unchanged — relative paths (resolved by
 * metadataBase) and genuine third-party URLs such as a Cloudinary image or an
 * external canonical for a cross-posted article.
 *
 * For values that come from the database (a post's canonicalUrl or ogImage),
 * which may have been entered while the site still lived on the Vercel alias.
 */
export function onSiteOrigin(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith('.vercel.app')) return url;
    return `${SITE_URL}${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return url;
  }
}
