import {
  ADDRESS,
  ACTIVE_SOCIAL_PROFILES,
  PHONE_E164,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SUPPORT_EMAIL,
} from '@/lib/site-config';

/**
 * Organization + Product structured data, emitted once from the root layout.
 *
 * Server component - this never ships to the browser as JS, only as markup.
 */
export default function JsonLd() {
  const organization = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
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

  const website = {
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { '@id': `${SITE_URL}/#organization` },
  };

  const product = {
    '@type': 'Product',
    '@id': `${SITE_URL}/#product`,
    name: 'Tapvyo NFC Digital Business Card',
    description:
      'An NFC business card that shares your contact details with a single tap, bundled with a free lifetime digital profile page.',
    brand: { '@id': `${SITE_URL}/#organization` },
    category: 'Business Cards',
    url: `${SITE_URL}/cards`,
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
      seller: { '@id': `${SITE_URL}/#organization` },
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
