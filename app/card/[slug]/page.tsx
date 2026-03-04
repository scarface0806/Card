import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import prisma from '@/lib/prisma';
import CardProfileView from '@/components/CardProfileView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Cache card fetch for 60 seconds to improve performance
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
  
  try {
    const card = await getCard(slug);

    if (!card || !card.isActive) {
      return {
        title: 'Card Not Found | Tapvyo',
        description: 'The requested digital business card could not be found.',
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

    const ogImage = details?.profileImage || details?.coverImage || '/og-default.png';
    const canonicalUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/card/${slug}`;

    // common title for og and twitter
    const pageTitle = `${fullName} | NFC Digital Card`;

    return {
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

  // Fetch card from database (cached)
  const card = await getCard(slug);

  // Handle not found or inactive
  if (!card || !card.isActive) {
    notFound();
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
