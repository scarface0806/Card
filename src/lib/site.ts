/**
 * The site's public identity, in one obvious place.
 *
 *   import { SITE_URL, SITE_NAME } from '@/lib/site';
 *
 * This is the module to reach for when you need a base URL. It is a facade over
 * `@/lib/site-config`, which holds the full brand/contact record — phone,
 * address, social profiles — and the origin resolver. Re-exported rather than
 * redeclared, so the two cannot drift.
 *
 * ---------------------------------------------------------------------------
 * WHY NOT `process.env.NEXT_PUBLIC_SITE_URL ?? "https://tapvyo.in"`
 * ---------------------------------------------------------------------------
 * That is the shape this file was asked for, and it is the shape that caused
 * the outage it was meant to prevent. `??` only falls back when the variable is
 * ABSENT. It was present — set to `https://tapvyo-nfc-card.vercel.app` in the
 * Vercel dashboard — so the fallback never ran, and every page on tapvyo.in
 * shipped a canonical tag pointing at the old alias. Google believed the tag
 * over the 308 redirect and indexed the wrong host.
 *
 * The resolver behind SITE_URL keeps the same contract — env var wins, with
 * https://tapvyo.in as the fallback — and adds one rule: a *.vercel.app origin
 * is never accepted, whatever the variable says. See resolveSiteUrl() in
 * site-config.ts.
 *
 * To get the literal `??` version instead, replace the SITE_URL line below
 * with:  export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? CANONICAL_ORIGIN;
 */
export { SITE_URL, SITE_NAME, CANONICAL_ORIGIN } from '@/lib/site-config';

/**
 * The origin to use for anything a search engine reads — canonical tags, the
 * sitemap, JSON-LD. Always the real domain, never an env-configured one.
 *
 * SITE_URL is for links the app itself hands out (emails, share sheets, QR
 * codes), which may legitimately point at a staging origin during development.
 */
export { CANONICAL_ORIGIN as SEO_ORIGIN } from '@/lib/site-config';
