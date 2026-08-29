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

/** Public origin. Falls back through both env var names used in this repo. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://tapvyo-nfc-card.vercel.app';

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

/** @needs-verification two different addresses existed; this one matches the domain. */
export const SUPPORT_EMAIL = 'hello@tapvyo.com';

export const ADDRESS = {
  city: 'Tiruchirappalli',
  state: 'Tamil Nadu',
  country: 'India',
  full: 'Tiruchirappalli, Tamil Nadu, India',
} as const;

/** Prefilled WhatsApp enquiry link. */
export function whatsappLink(
  message = 'Hi, I want a NFC digital business card'
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
