import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import prisma from '@/lib/prisma';
import CardProfileView from '@/components/CardProfileView';
import CustomerProfileView from '@/components/customer/CustomerProfileView';
import CardInactiveScreen from '@/components/CardInactiveScreen';
import { SITE_URL } from '@/lib/site-config';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Cache card fetch for 60 seconds to improve performance
const getCustomerProfile = cache(async (slug: string) => {
  return prisma.customer.findUnique({
    where: { slug },
    include: {
      galleries: {
        orderBy: { id: 'desc' },
      },
    },
  });
});

const getCard = cache(async (slug: string) => {
  return prisma.card.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      userId: true,
      cardType: true,
      status: true,
      details: true,
      views: true,
      taps: true,
      isActive: true,
      expiresAt: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
});

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  // SITE_URL, not NEXT_PUBLIC_APP_URL. That variable is "http://localhost:3000"
  // in .env.local, so reading it directly stamped a localhost canonical into
  // production metadata. SITE_URL resolves the Vercel-provided origins first
  // and is the same constant CardInactiveScreen builds its WhatsApp link from,
  // so the origin cannot drift between the two.
  const metadataBase = new URL(SITE_URL);

  try {
    const customer = await getCustomerProfile(slug);

    if (customer) {
      if (!customer.isActive) {
        return {
          metadataBase,
          title: 'Card Inactive | Tapvyo',
          description: 'This profile is inactive. Contact the Tapvyo team to reactivate.',
          robots: {
            index: false,
            follow: false,
          },
        };
      }
      const title = `${customer.name} | NFC Digital Profile`;
      const description = [customer.designation, customer.company].filter(Boolean).join(' at ') || customer.about || `Connect with ${customer.name}`;
      const image = customer.profileImage || customer.logo || '/og-image.png';
      const canonicalUrl = `${SITE_URL}/card/${slug}`;

      return {
        metadataBase,
        title,
        description,
        openGraph: {
          title,
          description,
          type: 'profile',
          url: canonicalUrl,
          images: [{ url: image, width: 1200, height: 630, alt: customer.name }],
          siteName: 'Tapvyo NFC',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [image],
        },
        alternates: {
          canonical: canonicalUrl,
        },
      };
    }

    const card = await getCard(slug);

    if (!card) {
      return {
        metadataBase,
        title: 'Card Not Found | Tapvyo',
        description: 'The requested digital business card could not be found.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    if (!card.isActive || card.status !== 'ACTIVE') {
      return {
        metadataBase,
        title: 'Card Inactive | Tapvyo',
        description: 'This card is inactive. Contact the Tapvyo team to reactivate.',
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const details = card.details;
    const fullName = details 
      ? [details.firstName, details.lastName].filter(Boolean).join(' ') 
      : card.user?.name || 'Digital Card';
    const designation = details?.title || '';
    const company = details?.company || '';

    // description should be designation + company
    const description = [designation, company].filter(Boolean).join(' at ');

    const ogImage = details?.profileImage || details?.coverImage || '/og-image.png';
    // Was `NEXT_PUBLIC_APP_URL || ''`, which produced a RELATIVE canonical
    // ("/card/x") whenever the variable was unset - not a valid canonical at all.
    const canonicalUrl = `${SITE_URL}/card/${slug}`;

    // common title for og and twitter
    const pageTitle = `${fullName} | NFC Digital Card`;

    return {
      metadataBase,
      title: pageTitle,
      description: description || `Connect with ${fullName}`,
      openGraph: {
        title: pageTitle,
        description: description || `Connect with ${fullName}`,
        type: 'profile',
        url: canonicalUrl,
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${fullName} | NFC Digital Card`,
          },
        ],
        siteName: 'Tapvyo NFC',
      },
      twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: description || `Connect with ${fullName}`,
        images: [ogImage],
        creator: details?.socialLinks?.twitter ? `@${details.socialLinks.twitter}` : undefined,
      },
      robots: {
        index: card.status === 'ACTIVE',
        follow: card.status === 'ACTIVE',
        googleBot: {
          index: card.status === 'ACTIVE',
          follow: card.status === 'ACTIVE',
        },
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  } catch (error) {
    return {
      metadataBase,
      title: 'Digital Business Card | Tapvyo',
      description: 'View this digital business card powered by Tapvyo NFC.',
    };
  }
}

// Force dynamic rendering - cards are fetched from DB at request time
export const dynamic = 'force-dynamic';
// Revalidate every 60 seconds for ISR-like behavior
export const revalidate = 60;

export default async function CardPage({ params }: PageProps) {
  const { slug } = await params;

  // A QUERY FAILURE IS NOT A VERDICT ABOUT THE CARD.
  //
  // Both loads below used to swallow their error: the customer lookup fell
  // through to `null` (so an existing profile ended at notFound(), a 404 for
  // something that exists) and the card lookup returned the inactive screen
  // outright - telling a paying customer their card was inactive because the
  // database blinked. Both are false statements to the visitor, and the second
  // generates a support message for every outage.
  //
  // The error is logged and rethrown instead, so Next renders app/error.tsx
  // with a 500. "Something went wrong, try again" is honest; "your card is
  // inactive, contact us to reactivate" is not.
  //
  // Only a lookup that SUCCEEDS and returns a row marked inactive reaches
  // CardInactiveScreen; only one that succeeds and returns null reaches
  // notFound().
  let customer: Awaited<ReturnType<typeof getCustomerProfile>>;
  try {
    customer = await getCustomerProfile(slug);
  } catch (error) {
    console.error('[card-page] Failed to load customer profile:', error);
    throw error;
  }

  if (customer && !customer.isActive) {
    return <CardInactiveScreen slug={slug} />;
  }

  if (customer) {
    return <CustomerProfileView customer={customer} />;
  }

  // Fetch card from database (cached)
  let card: Awaited<ReturnType<typeof getCard>>;
  try {
    card = await getCard(slug);
  } catch (error) {
    console.error('[card-page] Failed to load card:', error);
    throw error;
  }

  // Handle not found
  if (!card) {
    notFound();
  }

  // Handle not found or inactive
  if (!card.isActive || card.status !== 'ACTIVE') {
    return <CardInactiveScreen slug={slug} />;
  }

  // Handle expired card
  if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
    notFound();
  }

  // Increment view count asynchronously
  Promise.resolve().then(async () => {
    try {
      await prisma.card.update({
        where: { id: card.id },
        data: { views: { increment: 1 } },
      });
    } catch (error) {
      // Silently fail - don't block rendering
    }
  });

  // Transform null to undefined for component compatibility
  const transformDetails = (details: typeof card.details) => {
    if (!details) return null;
    
    // Transform social links
    const transformSocialLinks = (links: typeof details.socialLinks) => {
      if (!links) return undefined;
      return {
        linkedin: links.linkedin ?? undefined,
        twitter: links.twitter ?? undefined,
        facebook: links.facebook ?? undefined,
        instagram: links.instagram ?? undefined,
        youtube: links.youtube ?? undefined,
        tiktok: links.tiktok ?? undefined,
        github: links.github ?? undefined,
        whatsapp: links.whatsapp ?? undefined,
        telegram: links.telegram ?? undefined,
        snapchat: links.snapchat ?? undefined,
      };
    };

    // Transform custom fields
    const transformCustomFields = (fields: typeof details.customFields) => {
      if (!fields) return undefined;
      return fields.map(field => ({
        label: field.label,
        value: field.value,
        type: field.type ?? undefined,
        icon: field.icon ?? undefined,
      }));
    };
    
    return {
      firstName: details.firstName ?? undefined,
      lastName: details.lastName ?? undefined,
      title: details.title ?? undefined,
      company: details.company ?? undefined,
      bio: details.bio ?? undefined,
      email: details.email ?? undefined,
      phone: details.phone ?? undefined,
      website: details.website ?? undefined,
      profileImage: details.profileImage ?? undefined,
      coverImage: details.coverImage ?? undefined,
      logo: details.logo ?? undefined,
      socialLinks: transformSocialLinks(details.socialLinks),
      customFields: transformCustomFields(details.customFields),
      theme: details.theme ?? undefined,
      primaryColor: details.primaryColor ?? undefined,
      backgroundColor: details.backgroundColor ?? undefined,
    };
  };

  // Prepare card data for component
  const cardData = {
    id: card.id,
    slug: card.slug,
    cardType: card.cardType ?? undefined,
    status: card.status,
    details: transformDetails(card.details),
    views: card.views + 1, // Optimistic update
    taps: card.taps,
    createdAt: card.createdAt.toISOString(),
  };

  return <CardProfileView card={cardData} />;
}
