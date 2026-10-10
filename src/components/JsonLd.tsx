import { CANONICAL_ORIGIN, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site-config';
import { BUSINESS } from '@/lib/site';

/**
 * LocalBusiness + WebSite structured data, emitted once from the root
 * layout.
 *
 * LocalBusiness rather than plain Organization: it is a subtype of
 * Organization, so every `@id` reference to it below still holds, and it is the
 * type Google reads for local (city-qualified, map pack) results. Every NAP
 * field comes from BUSINESS, the same object the footer and contact page
 * render, so the markup and the visible page can never disagree.
 *
 * Every URL is built from CANONICAL_ORIGIN rather than SITE_URL. This is what
 * tells Google which entity "Tapvyo" is and which domain it lives on, so it
 * must name the real domain even if a deployment is configured with some other
 * origin.
 *
 * Server component - this never ships to the browser as JS, only as markup.
 */
export default function JsonLd() {
  const sameAs = Object.values(BUSINESS.socials).filter((url): url is string => Boolean(url));

  const organization = {
    '@type': 'LocalBusiness',
    '@id': `${CANONICAL_ORIGIN}/#organization`,
    name: BUSINESS.name,
    url: CANONICAL_ORIGIN,
    // Declared as an ImageObject with its dimensions: Google's logo guidelines
    // want a square image of at least 112x112, and stating the size saves it a
    // fetch to find out. Same file the favicon is cut from, so the mark in the
    // knowledge panel and the mark in the tab are the same artwork.
    logo: {
      '@type': 'ImageObject',
      url: `${CANONICAL_ORIGIN}/icon.png`,
      width: 512,
      height: 512,
    },
    image: `${CANONICAL_ORIGIN}/icon.png`,
    description: SITE_DESCRIPTION,
    email: BUSINESS.email,
    telephone: BUSINESS.phoneSchema,
    // No streetAddress or postalCode: neither has been confirmed, and an
    // invented one would contradict the Google Business Profile.
    address: {
      '@type': 'PostalAddress',
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.state,
      addressCountry: BUSINESS.countryCode,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: BUSINESS.phoneSchema,
      email: BUSINESS.email,
      areaServed: 'IN',
      availableLanguage: ['en', 'ta'],
    },
    // Only profiles with a confirmed URL - sameAs must not contain dead links.
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  // No `potentialAction`/SearchAction: the site has no search page to point one
  // at. Declaring a search endpoint that 404s is worse than declaring none —
  // Google validates the target before it will show a sitelinks searchbox.
  const website = {
    '@type': 'WebSite',
    '@id': `${CANONICAL_ORIGIN}/#website`,
    url: CANONICAL_ORIGIN,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { '@id': `${CANONICAL_ORIGIN}/#organization` },
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [organization, website],
  };

  return (
    <script
      type="application/ld+json"
      // Values are our own constants, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
