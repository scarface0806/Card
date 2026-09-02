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
 * Public origin, used for metadataBase, canonicals, the sitemap and JSON-LD.
 *
 * Resolution order matters. NEXT_PUBLIC_APP_URL is "http://localhost:3000" in
 * .env.local, so it must come AFTER the Vercel-provided values or a production
 * build would stamp localhost into every canonical URL.
 */
function resolveSiteUrl(): string {
  const trim = (url: string) => (url.endsWith("/") ? url.slice(0, -1) : url);

  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return trim(explicit);

  // Set by Vercel on production deployments; stable across deploys.
  const vercelProd = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProd) return `https://${vercelProd}`;

  // Per-deployment preview URL.
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) return trim(appUrl);

  return "https://tapvyo-nfc-card.vercel.app";
}

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
