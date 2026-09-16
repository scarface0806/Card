/**
 * SITE CONFIG — Single source of truth for contact + brand data.
 *
 * Nothing in this file may be duplicated in a component. If you need a phone
 * number, an email, an address or a social URL, import it from here.
 *
 * NOTE FOR THE BUSINESS OWNER: the values marked `@needs-verification` were
 * recovered from conflicting hardcoded values already in the codebase. They
 * have NOT been independently confirmed. Correct them here once and every
 * page updates.
 */

/**
 * True for any *.vercel.app origin — the legacy alias, and every per-deploy
 * preview hostname.
 *
 * These hosts may never become SITE_URL. A deployment served at tapvyo.in was
 * stamping `<link rel="canonical" href="https://tapvyo-nfc-card.vercel.app/...">`
 * onto every page, because an env var below resolved to the old alias. A
 * canonical tag outranks a redirect: Google honoured it and indexed the pages
 * under the .vercel.app host, which is the duplicate-content split the domain
 * migration was supposed to end.
 *
 * So configuration no longer gets the final say on the canonical origin. An
 * env var is a thing someone sets once in a dashboard and never looks at
 * again; a wrong one must not be able to de-index the live domain.
 */
function isVercelHost(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

/**
 * Public origin, used for metadataBase, canonicals, the sitemap and JSON-LD.
 *
 * Explicit configuration wins — a local dev origin or a staging domain has to
 * be settable — but only after it clears the *.vercel.app check above.
 */
function resolveSiteUrl(): string {
  const trim = (url: string) => (url.endsWith("/") ? url.slice(0, -1) : url);

  for (const candidate of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
  ]) {
    if (!candidate) continue;
    const url = trim(candidate);
    if (isVercelHost(url)) {
      // Loud, because the deployment is configured wrong even though the site
      // now behaves correctly. The build log is where someone will see it.
      console.warn(
        `[site-config] Ignoring Vercel origin "${url}" — falling back to ${CANONICAL_ORIGIN}. ` +
          `Point NEXT_PUBLIC_SITE_URL at the real domain.`,
      );
      continue;
    }
    return url;
  }

  return CANONICAL_ORIGIN;
}

/**
 * The primary domain. The ONLY place it is written down.
 *
 * This is the fallback AND the floor: resolveSiteUrl() above will not return a
 * *.vercel.app origin, so an unset or misconfigured NEXT_PUBLIC_SITE_URL lands
 * here rather than stamping the old alias into every canonical, OG URL and
 * sitemap entry. Setting NEXT_PUBLIC_SITE_URL correctly is still the right
 * thing to do; it is no longer load-bearing for the canonical domain.
 *
 * Apex, not www. next.config.ts redirects www and the old Vercel alias here,
 * so every host converges on one origin.
 */
export const CANONICAL_ORIGIN = "https://tapvyo.in";

/**
 * The pre-migration Vercel alias. Kept as a named constant ONLY so the
 * redirect in next.config.ts and this file cannot drift. Do not use it to
 * build URLs.
 */
export const LEGACY_VERCEL_HOST = "tapvyo-nfc-card.vercel.app";

export const SITE_URL = resolveSiteUrl();

/**
 * Bare host of SITE_URL ("example.com"), for places that show a domain as text
 * rather than link to it - card artwork, demo data, printed handles.
 * Derived, never a second copy of the literal, so it cannot drift from SITE_URL.
 */
export const SITE_HOST = (() => {
  try {
    const host = new URL(SITE_URL).host;
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return SITE_URL;
  }
})();

export const SITE_NAME = 'Tapvyo';
export const SITE_TAGLINE = 'Modern NFC Digital Business Cards';
export const SITE_DESCRIPTION =
  'Share your professional details with a single tap. Tapvyo NFC business cards come with a free lifetime digital profile.';

/**
 * Canonical phone number, digits and a leading `+` only.
 * A `tel:` href must never contain spaces — several devices refuse to dial it.
 * @needs-verification sourced from the header WhatsApp CTA.
 */
export const PHONE_E164 = '+917871361025';

/** Same number without `+`, for wa.me deep links. */
export const WHATSAPP_NUMBER = '917871361025';

/** Human-readable form for display only. Never use this in an href. */
export const PHONE_DISPLAY = '+91 78713 61025';

/**
 * Confirmed by the business owner. Was hello@tapvyo.com - not a real mailbox,
 * and tapvyo.com is not even a registered domain. Order confirmations tell
 * customers to reply within 24 hours to correct what gets printed, so this
 * has to be an address someone actually reads.
 */
export const SUPPORT_EMAIL = 'tapvyo@gmail.com';

export const ADDRESS = {
  city: 'Tiruchirappalli',
  state: 'Tamil Nadu',
  country: 'India',
  full: 'Tiruchirappalli, Tamil Nadu, India',
} as const;

/** Default enquiry text prefilled into every WhatsApp deep link. */
export const WHATSAPP_DEFAULT_MESSAGE = 'Hi, I want a NFC digital business card';

/** Prefilled WhatsApp enquiry link. */
export function whatsappLink(
  message: string = WHATSAPP_DEFAULT_MESSAGE
): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/**
 * Social profiles. `null` means "no confirmed profile" — callers MUST skip
 * nulls rather than render a link to a bare homepage.
 *
 * @needs-verification the three handles below were taken from the demo
 * profile page. `x` is null because no Tapvyo handle exists anywhere in the
 * codebase — the footer previously linked to `https://x.com`.
 */
export const SOCIAL_PROFILES: { name: string; url: string | null }[] = [
  { name: 'Instagram', url: 'https://www.instagram.com/tapvyo' },
  { name: 'Facebook', url: 'https://www.facebook.com/tapvyo' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/company/tapvyo' },
  { name: 'X', url: null },
];

/** Only the profiles that actually have a URL. */
export const ACTIVE_SOCIAL_PROFILES = SOCIAL_PROFILES.filter(
  (s): s is { name: string; url: string } => Boolean(s.url)
);

/** Look up one profile's URL by name. `null` when unconfirmed. */
function socialUrl(name: string): string | null {
  return SOCIAL_PROFILES.find((profile) => profile.name === name)?.url ?? null;
}

export const INSTAGRAM_URL = socialUrl('Instagram');
export const FACEBOOK_URL = socialUrl('Facebook');
export const LINKEDIN_URL = socialUrl('LinkedIn');

/**
 * Flat, camelCase view of everything above.
 *
 * Every value here is a REFERENCE to the constant that defines it, never a
 * second copy of the literal - so this object cannot drift from the exports it
 * mirrors. Both shapes exist on purpose: the named exports are what the
 * existing pages already import, this is the documented single-object form.
 */
export const siteConfig = {
  brandName: SITE_NAME,
  email: SUPPORT_EMAIL,
  phoneDisplay: PHONE_DISPLAY,
  phoneRaw: PHONE_E164,
  whatsapp: WHATSAPP_NUMBER,
  whatsappDefaultMessage: WHATSAPP_DEFAULT_MESSAGE,
  address: ADDRESS.full,
  social: {
    instagram: INSTAGRAM_URL,
    facebook: FACEBOOK_URL,
    linkedin: LINKEDIN_URL,
  },
} as const;
