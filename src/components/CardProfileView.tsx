'use client';

/**
 * CARD PROFILE — what a visitor sees when they tap a card created through the
 * order flow (/create-card), as opposed to an admin-created customer profile.
 *
 * Presentation only: rebuilt on the Tapvyo design system (.tv-* in globals.css)
 * so this view, CustomerProfileView and /preview-website are visibly one
 * product. The vCard export, the Web Share fallback and the lead form behind
 * CardContactForm are unchanged.
 *
 * Two things the old markup did that this one deliberately does not:
 *   - it painted the whole page with `details.backgroundColor` and every accent
 *     with `details.primaryColor`, so each card was a different-looking site.
 *     Both fields are still read from the card, but a profile is now drawn in
 *     the one system: ink ground, patina action, brass label;
 *   - it nested the "View location" anchor INSIDE the Share <button>, which is
 *     invalid HTML - the anchor was unreachable and the button had no visible
 *     label after it. Location is its own action now.
 */

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Phone,
  Mail,
  Globe,
  MapPin,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Github,
  MessageCircle,
  Send,
  Download,
  Share2,
  ExternalLink,
  ArrowUpRight,
} from 'lucide-react';
import CardContactForm from './CardContactForm';
import BrandLogo from './common/BrandLogo';
import { BRAND } from '@/lib/brand';
import { ROUTES } from '@/utils/constants';

// Card detail types matching Prisma schema
interface SocialLinks {
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  github?: string;
  whatsapp?: string;
  telegram?: string;
  snapchat?: string;
}

interface CustomField {
  label: string;
  value: string;
  type?: string;
}

interface CardDetail {
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  bio?: string;
  email?: string;
  phone?: string;
  website?: string;
  profileImage?: string;
  coverImage?: string;
  logo?: string;
  socialLinks?: SocialLinks;
  customFields?: CustomField[];
  theme?: string;
  primaryColor?: string;
  backgroundColor?: string;
  googleLocation?: string;
}

interface CardData {
  id: string;
  slug: string;
  cardType?: string;
  status: string;
  details: CardDetail | null;
  views: number;
  taps: number;
  createdAt: string;
}

interface CardProfileViewProps {
  card: CardData;
}

// Social icon mapping
const socialIcons: Record<string, React.ElementType> = {
  linkedin: Linkedin,
  twitter: Twitter,
  facebook: Facebook,
  instagram: Instagram,
  youtube: Youtube,
  github: Github,
  whatsapp: MessageCircle,
  telegram: Send,
};

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6 },
};

export default function CardProfileView({ card }: CardProfileViewProps) {
  const details = card.details;

  if (!details) {
    return (
      <div className="min-h-screen bg-[#070A09] flex items-center justify-center p-6">
        <p className="tv-body">Card details not available</p>
      </div>
    );
  }

  const fullName = [details.firstName, details.lastName].filter(Boolean).join(' ') || 'Unknown';
  const websiteHref = details.website
    ? details.website.startsWith('http')
      ? details.website
      : `https://${details.website}`
    : null;

  const socialEntries = Object.entries(details.socialLinks || {}).filter(
    ([, url]) => Boolean(url)
  ) as [string, string][];

  // Generate vCard for download
  const generateVCard = () => {
    const vcard = `BEGIN:VCARD
VERSION:3.0
N:${details.lastName || ''};${details.firstName || ''};;;
FN:${fullName}
TITLE:${details.title || ''}
ORG:${details.company || ''}
TEL;TYPE=CELL:${details.phone || ''}
EMAIL:${details.email || ''}
URL:${details.website || ''}
NOTE:${details.bio || ''}
END:VCARD`;

    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fullName.replace(/\s+/g, '_')}.vcf`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Share card
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${fullName} - Digital Business Card`,
          text: `Connect with ${fullName}${details.title ? ` - ${details.title}` : ''}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-[#070A09]">
      {/* PROFILE BAR */}
      <div className="tv-profilebar">
        <div className="site-container">
          <div className="tv-profilebar-bar">
            {/* Our mark, and the only logo on the page: a visitor who tapped a
                card needs to know whose platform this is. */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={ROUTES.HOME}
                target="_blank"
                rel="noopener noreferrer"
                className="tv-focus flex min-h-[44px] shrink-0 items-center"
                aria-label={`${BRAND.name} - NFC digital business cards (opens in a new tab)`}
              >
                <BrandLogo size="small" variant="light" />
              </Link>
              <span className="tv-mono truncate">{details.company || fullName}</span>
            </div>

            <button onClick={generateVCard} className="tv-btn tv-btn-primary shrink-0">
              <Download className="w-[18px] h-[18px]" aria-hidden="true" />
              Save contact
            </button>
          </div>
        </div>
      </div>

      <main>
        {/* IDENTITY */}
        <section className="tv-hero pt-28 pb-16 md:pt-36 md:pb-24" id="about">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-5"
              >
                <div className="tv-portrait max-w-[22rem] lg:max-w-none">
                  {details.profileImage ? (
                    <img
                      src={details.profileImage}
                      alt={fullName}
                      width={800}
                      height={1000}
                      decoding="async"
                    />
                  ) : (
                    /* No upload: the initial, set in the display face, rather
                       than a coloured circle with a letter in it. */
                    <div className="flex h-full w-full items-center justify-center bg-[#151C1A]">
                      <span
                        className="tv-display"
                        style={{ fontSize: 'clamp(4rem, 12vw, 8rem)' }}
                        aria-hidden="true"
                      >
                        {fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="lg:col-span-7"
              >
                {/* No owner logo here — see the note in CustomerProfileView.
                    A profile leads with the name and the portrait. */}
                <p className="tv-eyebrow mb-6">Digital profile</p>
                <h1 className="tv-display mb-4">{fullName}</h1>
                <p className="tv-lead mb-9 tv-measure-lead">
                  {[details.title, details.company].filter(Boolean).join(' · ') ||
                    'NFC Digital Card'}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <button
                    onClick={generateVCard}
                    className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block"
                  >
                    Save contact
                    <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="tv-btn tv-btn-lg tv-btn-secondary tv-btn-block"
                  >
                    <Share2 className="w-[18px] h-[18px]" aria-hidden="true" />
                    Share
                  </button>
                </div>

                {details.googleLocation ? (
                  <p className="tv-small mb-9">
                    <a
                      href={details.googleLocation}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="tv-btn-tertiary !min-h-0"
                    >
                      View location
                    </a>
                  </p>
                ) : null}

                {socialEntries.length > 0 ? (
                  <ul className="flex flex-wrap gap-3">
                    {socialEntries.map(([platform, url]) => {
                      const Icon = socialIcons[platform] || ExternalLink;
                      const label = platform.charAt(0).toUpperCase() + platform.slice(1);
                      return (
                        <li key={platform}>
                          <Link
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tv-iconlink tv-focus"
                            aria-label={`${label} (opens in a new tab)`}
                          >
                            <Icon
                              className="w-[18px] h-[18px]"
                              strokeWidth={1.7}
                              aria-hidden="true"
                            />
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </motion.div>
            </div>
          </div>
        </section>

        {/* BIO */}
        {details.bio ? (
          <section className="tv-surface-graphite tv-section-tight">
            <div className="site-container">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
                <motion.div {...fadeInUp} className="lg:col-span-4">
                  <div className="lg:sticky lg:top-28">
                    <p className="tv-eyebrow mb-6">About</p>
                    <h2 className="tv-h2">{details.company || 'Background.'}</h2>
                  </div>
                </motion.div>

                <motion.div
                  {...fadeInUp}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="lg:col-span-8"
                >
                  <p className="tv-lead tv-measure-body whitespace-pre-line">{details.bio}</p>
                </motion.div>
              </div>
            </div>
          </section>
        ) : null}

        {/* COVER — the card's one image beyond the portrait. It used to be a
            192px band cropped behind a gradient; framed here it is actually
            visible. Sits where a customer profile shows its gallery. */}
        {details.coverImage ? (
          <section className="tv-surface-ink tv-section-tight">
            <div className="site-container">
              <motion.figure {...fadeInUp} className="tv-figure">
                <div className="tv-figure-media" style={{ aspectRatio: '16 / 7' }}>
                  <img
                    src={details.coverImage}
                    alt={`${fullName} cover image`}
                    width={1600}
                    height={700}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </motion.figure>
            </div>
          </section>
        ) : null}

        {/* CONTACT — details, custom fields and the enquiry form, on bone, as
            on every other profile surface. */}
        <section className="tv-surface-bone tv-section" id="contact">
          <div className="site-container">
            <motion.div {...fadeInUp} className="max-w-2xl mb-12 md:mb-16">
              <p className="tv-eyebrow mb-6">Contact</p>
              <h2 className="tv-h2 mb-4">Get in touch.</h2>
              <p className="tv-lead tv-measure-body">
                Save the contact card, reach out directly, or send a message.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              <motion.div {...fadeInUp} className="lg:col-span-5">
                <ul>
                  {details.phone ? (
                    <li className="tv-detail-row">
                      <span className="tv-detail-ico" aria-hidden="true">
                        <Phone className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="tv-detail-val">
                        <span className="tv-mono block mb-1">Phone</span>
                        <a href={`tel:${details.phone}`} className="tv-btn-tertiary !min-h-0">
                          {details.phone}
                        </a>
                      </span>
                    </li>
                  ) : null}

                  {details.email ? (
                    <li className="tv-detail-row">
                      <span className="tv-detail-ico" aria-hidden="true">
                        <Mail className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="tv-detail-val">
                        <span className="tv-mono block mb-1">Email</span>
                        <a href={`mailto:${details.email}`} className="tv-btn-tertiary !min-h-0">
                          {details.email}
                        </a>
                      </span>
                    </li>
                  ) : null}

                  {websiteHref ? (
                    <li className="tv-detail-row">
                      <span className="tv-detail-ico" aria-hidden="true">
                        <Globe className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="tv-detail-val">
                        <span className="tv-mono block mb-1">Website</span>
                        <a
                          href={websiteHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tv-btn-tertiary !min-h-0"
                        >
                          {details.website?.replace(/^https?:\/\//, '')}
                        </a>
                      </span>
                    </li>
                  ) : null}

                  {details.googleLocation ? (
                    <li className="tv-detail-row">
                      <span className="tv-detail-ico" aria-hidden="true">
                        <MapPin className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="tv-detail-val">
                        <span className="tv-mono block mb-1">Location</span>
                        <a
                          href={details.googleLocation}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tv-btn-tertiary !min-h-0"
                        >
                          Open in Maps
                        </a>
                      </span>
                    </li>
                  ) : null}

                  {/* Custom fields are the same labelled-value row, so they no
                      longer read as a different kind of information. */}
                  {(details.customFields || []).map((field, index) => (
                    <li key={`${field.label}-${index}`} className="tv-detail-row">
                      <span className="tv-detail-ico" aria-hidden="true">
                        <ExternalLink className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="tv-detail-val">
                        <span className="tv-mono block mb-1">{field.label}</span>
                        <span className="tv-body">{field.value}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                {...fadeInUp}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-7"
              >
                <div className="tv-panel tv-panel-pad">
                  <h3 className="tv-h3 mb-2">Send a message</h3>
                  <p className="tv-body mb-6">
                    Your details go straight to {fullName.split(' ')[0]} — nobody else sees
                    them.
                  </p>
                  <CardContactForm cardSlug={card.slug} />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* OUR CLOSE — the one place on someone else's profile that sells ours.
            Both links open in a new tab so the visitor does not lose the
            profile they came to read. */}
        <section className="tv-surface-graphite tv-section-tight">
          <div className="site-container">
            <motion.div
              {...fadeInUp}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end border-t border-[#C9A961]/25 pt-12"
            >
              <div className="lg:col-span-7">
                <p className="tv-eyebrow mb-6">Powered by {BRAND.name}</p>
                <h2 className="tv-h2 mb-4">Want a profile like this one?</h2>
                <p className="tv-body tv-measure-body">
                  This page came free with a {BRAND.name} NFC card. Set up yours in under
                  two minutes — one tap shares your details, and you can edit them
                  whenever they change.
                </p>
              </div>

              <div className="lg:col-span-5 lg:justify-self-end">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={ROUTES.CREATE_CARD}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block"
                  >
                    Create your card
                    <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </Link>
                  <Link
                    href={ROUTES.CARDS}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tv-btn tv-btn-lg tv-btn-secondary tv-btn-block"
                  >
                    View card designs
                    <span className="sr-only"> (opens in a new tab)</span>
                  </Link>
                </div>

                <p className="tv-mono mt-5 lg:text-right">Takes under 2 minutes</p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="tv-surface-graphite border-t border-[#F1F3F1]/10">
        <div className="site-container py-8">
          <p className="tv-small">
            Powered by{' '}
            <Link href="/" className="tv-btn-tertiary !min-h-0">
              Tapvyo
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
