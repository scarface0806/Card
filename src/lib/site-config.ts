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
 * The public contact address, set by the business owner.
 *
 * History matters here, because this value has been wrong before. It was first
 * hello@tapvyo.com — not a mailbox, on a domain that is not registered. It was
 * then a guessed Gmail address, then tapvyonfc@gmail.com. It is now an address
 * on the site's own domain.
 *
 * This one constant feeds the footer, contact and policy pages, JSON-LD, the
 * order emails' reply-to (unless EMAIL_REPLY_TO overrides it) AND the admin
 * order alerts (ADMIN_NOTIFICATION_EMAIL). Order confirmations tell customers to
 * reply within 24 hours to correct what gets printed, so this mailbox must
 * exist and be read, or print corrections and order alerts are silently lost.
 */
export const SUPPORT_EMAIL = 'hello@tapvyo.in';

/**
 * The address the site footer links to, set by the business owner. The footer
 * shows only the short label (not the full address); clicking it opens a mail
 * draft addressed to FOOTER_EMAIL. Deliberately separate from SUPPORT_EMAIL so
 * changing it does not touch order-email reply-to or admin alerts.
 */
export const FOOTER_EMAIL = 'tapvyonfc@gmail.com';
export const FOOTER_EMAIL_LABEL = 'tapvyonfc';

export const ADDRESS = {
  city: 'Madurai',
  state: 'Tamil Nadu',
  country: 'India',
  full: 'Madurai, Tamil Nadu, India',
} as const;

/** Default enquiry text prefilled into every WhatsApp deep link. */
export const WHATSAPP_DEFAULT_MESSAGE = 'Hi, I want a NFC digital business card';

/** Prefilled WhatsApp enquiry link. */
export function whatsappLink(
  message: string = WHATSAPP_DEFAULT_MESSAGE
): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

/** Prefilled text for the floating WhatsApp button shown site-wide. */
export const WHATSAPP_FLOATING_MESSAGE = "Hi Tapvyo, I'd like to know more about NFC cards";

/* ---------------------------------------------------------------------------
   PROMISES AND SOCIAL PROOF

   Everything the site claims about delivery, replacements, ratings and
   customers lives here, so a claim is changed in one place and never asserted
   anywhere it has not been checked. Only put REAL, verifiable values here.
   --------------------------------------------------------------------------- */

/** Delivery estimates in working days. Shown on /cards, checkout and the FAQ. */
export const DELIVERY_DAYS = {
  tamilNadu: '3-5',
  restOfIndia: '5-8',
} as const;

export const DELIVERY_TEXT = `Delivered in ${DELIVERY_DAYS.tamilNadu} working days across Tamil Nadu, ${DELIVERY_DAYS.restOfIndia} days rest of India`;

/** Every card carries a printed QR code that opens the same profile. */
export const QR_BACKUP_TEXT =
  'Every card has a QR code on the back, so it works even on phones without NFC.';

/**
 * Replacement guarantee. The full terms are section 5 of /refund-policy - keep
 * the two in step if the window changes.
 */
export const REPLACEMENT_GUARANTEE_DAYS = 30;
export const REPLACEMENT_GUARANTEE_TEXT = `NFC not working? Free replacement within ${REPLACEMENT_GUARANTEE_DAYS} days.`;

export interface TrustStat {
  /** e.g. "Cards delivered". */
  label: string;
  /** e.g. "1,200+". Leave EMPTY until you have a real number - an empty value hides the stat. */
  value: string;
}

/**
 * The stats strip under the homepage hero. A stat with an empty value is not
 * rendered at all, and the strip disappears when every value is empty - so
 * fill these in only with numbers you can stand behind.
 */
export const TRUST_STATS: TrustStat[] = [
  { label: 'Google rating', value: '' },
  { label: 'Cards delivered', value: '' },
  { label: 'Businesses served', value: '' },
];

export interface Testimonial {
  name: string;
  /** e.g. "Real estate agent". */
  role: string;
  /** e.g. "Madurai". */
  city: string;
  quote: string;
  /** Optional customer photo (Cloudinary URL recommended). */
  photoUrl?: string;
  /** Optional link to a video testimonial (YouTube, Instagram...). */
  videoUrl?: string;
}

/**
 * Real customer testimonials, with the customer's permission. The homepage
 * section is hidden entirely while this list is empty.
 */
export const TESTIMONIALS: Testimonial[] = [];

/**
 * Social profiles. `null` means "no confirmed profile" — callers MUST skip
 * nulls rather than render a link to a bare homepage.
 *
 * Facebook and Instagram are confirmed. LinkedIn is still
 * @needs-verification — it was taken from the demo profile page and has never
 * been checked against a real account. `x` is null because no Tapvyo handle
 * exists anywhere in the codebase; the footer previously linked to a bare
 * `https://x.com`.
 *
 * Store the canonical profile URL only. Share links arrive carrying tracking
 * parameters (`fbclid`, `igsh`, `utm_*`); those belong to the click that
 * produced them, and these URLs are published in structured data.
 */
export const SOCIAL_PROFILES: { name: string; url: string | null }[] = [
  // Confirmed by the owner. The handle was already right; what the confirmation
  // changed is that it is no longer a guess copied off the demo profile.
  //
  // The `?fbclid=...` on the link it was confirmed from is Facebook's
  // click-tracking token, generated for whoever clicked it. It is stripped
  // deliberately: it identifies a click, not the profile, and this URL is
  // published in the Organization `sameAs` array and the site footer.
  { name: 'Instagram', url: 'https://www.instagram.com/tapvyo/' },
  // Confirmed by the owner. The numeric /people/<name>/<id>/ form is the real
  // permalink for this page — facebook.com/tapvyo was a vanity URL that had
  // never been claimed, so it 404'd. This URL is also what goes into the
  // Organization `sameAs` array, where a dead link is worse than no link:
  // Google uses those to confirm the business is the same entity across sites.
  { name: 'Facebook', url: 'https://www.facebook.com/people/tapvyo/61594096016285/' },
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
