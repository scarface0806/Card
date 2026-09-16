import {
  ADDRESS,
  ACTIVE_SOCIAL_PROFILES,
  CANONICAL_ORIGIN,
  PHONE_E164,
  SITE_DESCRIPTION,
  SITE_NAME,
  SUPPORT_EMAIL,
} from '@/lib/site-config';

/**
 * Organization + WebSite + Product structured data, emitted once from the root
 * layout.
 *
 * Every URL is built from CANONICAL_ORIGIN rather than SITE_URL. This is what
 * tells Google which entity "Tapvyo" is and which domain it lives on, so it
 * must name the real domain even if a deployment is configured with some other
 * origin.
 *
 * Server component - this never ships to the browser as JS, only as markup.
 */
export default function JsonLd() {
  const organization = {
    '@type': 'Organization',
    '@id': `${CANONICAL_ORIGIN}/#organization`,
    name: SITE_NAME,
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
    email: SUPPORT_EMAIL,
    telephone: PHONE_E164,
    address: {
      '@type': 'PostalAddress',
      addressLocality: ADDRESS.city,
      addressRegion: ADDRESS.state,
      addressCountry: 'IN',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: PHONE_E164,
      email: SUPPORT_EMAIL,
      areaServed: 'IN',
      availableLanguage: ['en', 'ta'],
    },
    // Only profiles with a confirmed URL - sameAs must not contain dead links.
    ...(ACTIVE_SOCIAL_PROFILES.length > 0
      ? { sameAs: ACTIVE_SOCIAL_PROFILES.map((s) => s.url) }
      : {}),
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

  const product = {
    '@type': 'Product',
    '@id': `${CANONICAL_ORIGIN}/#product`,
    name: 'Tapvyo NFC Digital Business Card',
    description:
      'An NFC business card that shares your contact details with a single tap, bundled with a free lifetime digital profile page.',
    brand: { '@id': `${CANONICAL_ORIGIN}/#organization` },
    category: 'Business Cards',
    url: `${CANONICAL_ORIGIN}/cards`,
    // Prices come from the product catalogue; 599 is the entry price every
    // fallback design carries. No aggregateRating is claimed here - see the
    // handover note about the "4.9/5" figure.
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'INR',
      lowPrice: '599',
      highPrice: '799',
      offerCount: '6',
      availability: 'https://schema.org/InStock',
      seller: { '@id': `${CANONICAL_ORIGIN}/#organization` },
    },
  };

  const graph = {
    '@context': 'https://schema.org',
    '@graph': [organization, website, product],
  };

  return (
    <script
      type="application/ld+json"
      // Values are our own constants, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
