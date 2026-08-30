'use client';

/**
 * CUSTOMER PROFILE — what a visitor sees when they tap an admin-created card.
 *
 * Presentation only: rebuilt on the Tapvyo design system (.tv-* in
 * globals.css) so this page, /preview-website and CardProfileView are visibly
 * one product. Nothing about how a profile is created, stored or delivered was
 * touched - lead submission, the three mail delivery modes, URL and map-embed
 * normalisation and the gallery slot logic below are unchanged.
 *
 * Gone with the old markup: ~610 lines of component-local CSS carrying a third
 * palette (#14B8A6 teal), the Font Awesome CDN stylesheet, and the light/dark
 * switch - which toggled a `dark` class on <body> that only that CSS read, so
 * once the CSS went there was nothing for it to switch.
 */

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
} from 'lucide-react';
import { BRAND } from '@/lib/brand';
import { isAbortError, logFetchError } from '@/lib/fetch-utils';

type GalleryItem = {
  id: string;
  image: string;
  hoverText?: string | null;
  slot: number;
};

type CustomerProfile = {
  id: string;
  name: string;
  designation?: string | null;
  company?: string | null;
  about?: string | null;
  phone: string;
  email: string;
  website?: string | null;
  websiteEnabled: boolean;
  linkedin?: string | null;
  linkedinEnabled: boolean;
  whatsapp?: string | null;
  whatsappEnabled: boolean;
  instagram?: string | null;
  instagramEnabled: boolean;
  facebook?: string | null;
  facebookEnabled: boolean;
  behance?: string | null;
  behanceEnabled: boolean;
  mailApiEndpoint?: string | null;
  address?: string | null;
  mapEmbedUrl?: string | null;
  logo?: string | null;
  profileImage?: string | null;
  slug: string;
  galleries: GalleryItem[];
};

interface CustomerProfileViewProps {
  customer: CustomerProfile;
}

interface ContactFormState {
  name: string;
  phone: string;
  email: string;
  subject: string;
  message: string;
}

const DEFAULT_ABOUT =
  "We are here to help you grow with an NFC-powered digital profile. Reach out through the contact form and we will respond shortly.";

type MailDeliveryMode = 'internal' | 'endpoint' | 'web3forms';

function normalizeUrl(url?: string | null) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

function normalizeMapEmbedSrc(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const iframeSrcMatch = trimmed.match(/<iframe[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  const candidate = (iframeSrcMatch?.[1] || trimmed).replace(/&amp;/g, '&').trim();

  if (!candidate || (!candidate.startsWith('http://') && !candidate.startsWith('https://'))) {
    return null;
  }

  try {
    const parsed = new URL(candidate);
    const isGoogleHost = parsed.hostname === 'google.com' || parsed.hostname === 'www.google.com' || parsed.hostname.endsWith('.google.com');
    const isEmbedPath = parsed.pathname.startsWith('/maps/embed');
    return isGoogleHost && isEmbedPath ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function hasExplicitMailEndpoint(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return trimmed.startsWith('/api/') || trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

function isWeb3FormsAccessKey(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return /^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/.test(trimmed);
}

function getMailDeliveryMode(value?: string | null): MailDeliveryMode {
  if (hasExplicitMailEndpoint(value)) return 'endpoint';
  if (isWeb3FormsAccessKey(value)) return 'web3forms';
  return 'internal';
}

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6 },
};

export default function CustomerProfileView({ customer }: CustomerProfileViewProps) {
  const [form, setForm] = useState<ContactFormState>({ name: '', phone: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const gallerySlots = useMemo(() => {
    const ordered = [...customer.galleries].sort((a, b) => a.slot - b.slot).slice(0, 3);
    if (ordered.length === 0) return [];
    if (ordered.length >= 3) return ordered;

    const missing = [] as GalleryItem[];
    for (let i = ordered.length + 1; i <= 3; i += 1) {
      missing.push({
        id: `placeholder-${i}`,
        slot: i,
        image: '/no-image-placeholder.svg',
        hoverText: 'No Image',
      });
    }
    return [...ordered, ...missing].sort((a, b) => a.slot - b.slot);
  }, [customer.galleries]);

  const socialLinks = useMemo(
    () => [
      // Same channels, same enable flags, same order. Only the icon changed:
      // a lucide component instead of a Font Awesome class name, so the page
      // no longer pulls a CDN stylesheet to draw six glyphs. Behance has no
      // lucide glyph, so it takes the portfolio icon.
      { key: 'whatsapp', enabled: customer.whatsappEnabled, url: normalizeUrl(customer.whatsapp), title: 'WhatsApp', icon: MessageCircle },
      { key: 'instagram', enabled: customer.instagramEnabled, url: normalizeUrl(customer.instagram), title: 'Instagram', icon: Instagram },
      { key: 'facebook', enabled: customer.facebookEnabled, url: normalizeUrl(customer.facebook), title: 'Facebook', icon: Facebook },
      { key: 'linkedin', enabled: customer.linkedinEnabled, url: normalizeUrl(customer.linkedin), title: 'LinkedIn', icon: Linkedin },
      { key: 'behance', enabled: customer.behanceEnabled, url: normalizeUrl(customer.behance), title: 'Behance', icon: Palette },
      { key: 'website', enabled: customer.websiteEnabled, url: normalizeUrl(customer.website), title: 'Website', icon: Globe },
    ].filter((item) => item.enabled && item.url),
    [customer]
  );

  const mapEmbedSrc = useMemo(() => normalizeMapEmbedSrc(customer.mapEmbedUrl), [customer.mapEmbedUrl]);
  const shopName = customer.company?.trim() || '';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const mailMode = getMailDeliveryMode(customer.mailApiEndpoint);

      const leadResponse = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customer.id,
          name: form.name,
          phone: form.phone,
          email: form.email,
          message: form.message,
          skipEmail: mailMode !== 'internal',
        }),
      });

      const leadPayload = await leadResponse.json();
      if (!leadResponse.ok) {
        throw new Error(leadPayload.error || 'Failed to submit message');
      }

      if (mailMode === 'endpoint') {
        const endpoint = customer.mailApiEndpoint!.trim();
        const emailResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: customer.email,
            name: form.name,
            email: form.email,
            phone: form.phone,
            subject: form.subject,
            message: form.message,
          }),
        });

        if (!emailResponse.ok) {
          throw new Error('Failed to send lead email');
        }
      }

      if (mailMode === 'web3forms') {
        const web3Response = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            access_key: customer.mailApiEndpoint!.trim(),
            name: form.name,
            phone: form.phone,
            email: form.email,
            subject: form.subject?.trim() || `New enquiry for ${customer.name}`,
            message: form.message,
            from_name: customer.name,
          }),
        });

        const web3Payload = await web3Response.json().catch(() => ({} as { message?: string }));
        if (!web3Response.ok) {
          throw new Error(web3Payload.message || 'Failed to send lead email');
        }
      }

      setFeedback({ type: 'success', text: 'Your message has been sent successfully' });
      setForm({ name: '', phone: '', email: '', subject: '', message: '' });
    } catch (error) {
      // An abort means the page went away mid-submit - nothing to report.
      if (isAbortError(error)) return;

      logFetchError('Lead submission failed:', error);
      setFeedback({ type: 'error', text: error instanceof Error ? error.message : 'Failed to submit message' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A09]">
      {/* PROFILE BAR — the owner's mark on the left, and the one action a
          visitor wants before they have read anything: call. */}
      <div className="tv-profilebar">
        <div className="site-container">
          <div className="tv-profilebar-bar">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={customer.logo || BRAND.logo}
                alt={shopName || customer.name}
                width={200}
                height={60}
                className="h-8 w-auto object-contain"
              />
              {shopName ? (
                <span className="tv-mono truncate hidden sm:block">{shopName}</span>
              ) : null}
            </div>

            <a href={`tel:${customer.phone}`} className="tv-btn tv-btn-primary shrink-0">
              <Phone className="w-[18px] h-[18px]" aria-hidden="true" />
              Call
            </a>
          </div>
        </div>
      </div>

      <main>
        {/* IDENTITY — same portrait plate, eyebrow, display name and channel
            row as /preview-website. */}
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
                  <img
                    src={customer.profileImage || '/no-image-placeholder.svg'}
                    alt={customer.name}
                    width={800}
                    height={1000}
                    decoding="async"
                  />
                </div>
                {customer.address ? (
                  <p className="tv-mono mt-4">{customer.address}</p>
                ) : null}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="lg:col-span-7"
              >
                <p className="tv-eyebrow mb-6">Digital profile</p>
                <h1 className="tv-display mb-4">{customer.name}</h1>
                <p className="tv-lead mb-9 tv-measure-lead">
                  {[customer.designation, customer.company].filter(Boolean).join(' · ') ||
                    'NFC Digital Profile'}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-9">
                  <a href="#contact" className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block">
                    Get in touch
                    <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                  </a>
                  <a
                    href={`mailto:${customer.email}`}
                    className="tv-btn tv-btn-lg tv-btn-secondary tv-btn-block"
                  >
                    Email
                  </a>
                </div>

                {socialLinks.length > 0 ? (
                  <ul className="flex flex-wrap gap-3">
                    {socialLinks.map((social) => {
                      const Icon = social.icon;
                      return (
                        <li key={social.key}>
                          <a
                            href={social.url || '#'}
                            className="tv-iconlink tv-focus"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${social.title} (opens in a new tab)`}
                          >
                            <Icon
                              className="w-[18px] h-[18px]"
                              strokeWidth={1.7}
                              aria-hidden="true"
                            />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section className="tv-surface-graphite tv-section-tight">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              <motion.div {...fadeInUp} className="lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                  <p className="tv-eyebrow mb-6">About</p>
                  {/* The company name where there is one, a neutral title
                      otherwise. Falling back to the person's name repeated the
                      h1 verbatim two sections apart. */}
                  <h2 className="tv-h2">{shopName || 'Background.'}</h2>
                </div>
              </motion.div>

              <motion.div
                {...fadeInUp}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-8"
              >
                {/* Admin enters this as free text; a blank line in it was being
                    collapsed to a single paragraph before. */}
                <p className="tv-lead tv-measure-body whitespace-pre-line">
                  {customer.about || DEFAULT_ABOUT}
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* GALLERY — the same figure and caption-on-a-hairline as the demo, so
            a three-image gallery and the demo's six-image grid read as one
            component at two lengths. */}
        {gallerySlots.length > 0 ? (
          <section className="tv-surface-ink tv-section" id="works">
            <div className="site-container">
              <motion.div {...fadeInUp} className="max-w-2xl mb-12 md:mb-16">
                <p className="tv-eyebrow mb-6">Portfolio</p>
                <h2 className="tv-h2">Gallery.</h2>
              </motion.div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
                {gallerySlots.map((gallery, index) => (
                  <motion.li
                    key={gallery.id}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.55, delay: (index % 3) * 0.08 }}
                  >
                    <figure className="tv-figure">
                      <div className="tv-figure-media">
                        <img
                          src={gallery.image || '/no-image-placeholder.svg'}
                          alt={gallery.hoverText || `Gallery image ${index + 1}`}
                          width={800}
                          height={600}
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                      <figcaption className="tv-figure-cap">
                        <h3 className="tv-h4">{gallery.hoverText || 'No Image'}</h3>
                        <span className="tv-mono shrink-0" aria-hidden="true">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </figcaption>
                    </figure>
                  </motion.li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* CONTACT — on bone, exactly as on /preview-website and /contact-us. */}
        <section className="tv-surface-bone tv-section" id="contact">
          <div className="site-container">
            <motion.div {...fadeInUp} className="max-w-2xl mb-12 md:mb-16">
              <p className="tv-eyebrow mb-6">Contact</p>
              <h2 className="tv-h2 mb-4">Get in touch.</h2>
              <p className="tv-lead tv-measure-body">
                Have a question or want to work together? Send a message and we&apos;ll
                get back to you shortly.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              {/* Details + map */}
              <motion.div {...fadeInUp} className="lg:col-span-5">
                <ul className="mb-10">
                  <li className="tv-detail-row">
                    <span className="tv-detail-ico" aria-hidden="true">
                      <Phone className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="tv-detail-val">
                      <span className="tv-mono block mb-1">Phone</span>
                      <a href={`tel:${customer.phone}`} className="tv-btn-tertiary !min-h-0">
                        {customer.phone}
                      </a>
                    </span>
                  </li>

                  <li className="tv-detail-row">
                    <span className="tv-detail-ico" aria-hidden="true">
                      <Mail className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span className="tv-detail-val">
                      <span className="tv-mono block mb-1">Email</span>
                      <a href={`mailto:${customer.email}`} className="tv-btn-tertiary !min-h-0">
                        {customer.email}
                      </a>
                    </span>
                  </li>

                  {customer.address ? (
                    <li className="tv-detail-row">
                      <span className="tv-detail-ico" aria-hidden="true">
                        <MapPin className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      <span className="tv-detail-val">
                        <span className="tv-mono block mb-1">Address</span>
                        <span className="tv-body">{customer.address}</span>
                      </span>
                    </li>
                  ) : null}
                </ul>

                {mapEmbedSrc ? (
                  <div className="tv-embed">
                    <iframe
                      src={mapEmbedSrc}
                      height={300}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`Map showing ${customer.name}`}
                    />
                  </div>
                ) : null}
              </motion.div>

              {/* Form. Every field gets a real label — the placeholders were
                  doing that job and vanished the moment anyone typed. */}
              <motion.div
                {...fadeInUp}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-7"
              >
                <div className="tv-panel tv-panel-pad">
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                      <div className="tv-field">
                        <label htmlFor="cp-name" className="tv-label">
                          Your name<span className="tv-label-req">*</span>
                        </label>
                        <input
                          id="cp-name"
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm((c) => ({ ...c, name: e.target.value }))}
                          placeholder="Priya Raman"
                          autoComplete="name"
                          required
                          className="tv-input"
                        />
                      </div>

                      <div className="tv-field">
                        <label htmlFor="cp-phone" className="tv-label">
                          Phone<span className="tv-label-req">*</span>
                        </label>
                        <input
                          id="cp-phone"
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm((c) => ({ ...c, phone: e.target.value }))}
                          placeholder="9876543210"
                          inputMode="tel"
                          autoComplete="tel"
                          required
                          className="tv-input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                      <div className="tv-field">
                        <label htmlFor="cp-email" className="tv-label">
                          Email<span className="tv-label-req">*</span>
                        </label>
                        <input
                          id="cp-email"
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                          placeholder="your@email.com"
                          inputMode="email"
                          autoComplete="email"
                          required
                          className="tv-input"
                        />
                      </div>

                      <div className="tv-field">
                        <label htmlFor="cp-subject" className="tv-label">
                          Subject
                        </label>
                        <input
                          id="cp-subject"
                          type="text"
                          value={form.subject}
                          onChange={(e) => setForm((c) => ({ ...c, subject: e.target.value }))}
                          placeholder="Enquiry"
                          className="tv-input"
                        />
                      </div>
                    </div>

                    <div className="tv-field">
                      <label htmlFor="cp-message" className="tv-label">
                        Message<span className="tv-label-req">*</span>
                      </label>
                      <textarea
                        id="cp-message"
                        value={form.message}
                        onChange={(e) => setForm((c) => ({ ...c, message: e.target.value }))}
                        placeholder="Tell us what you need…"
                        rows={5}
                        required
                        className="tv-textarea"
                      />
                    </div>

                    <div className="mt-7">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Sending…' : 'Send message'}
                        {!submitting && (
                          <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                        )}
                      </button>

                      {/* Outcome is both visible and announced. */}
                      <div aria-live="polite">
                        {feedback ? (
                          <p
                            className={
                              feedback.type === 'success'
                                ? 'tv-form-success mt-4'
                                : 'tv-form-error mt-4'
                            }
                            {...(feedback.type === 'error' ? { role: 'alert' } : {})}
                          >
                            {feedback.text}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <footer className="tv-surface-graphite border-t border-[#F1F3F1]/10">
        <div className="site-container py-8">
          <p className="tv-small">
            © {new Date().getFullYear()} All rights reserved. Designed &amp; developed by{' '}
            <a
              href="https://tapvyo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="tv-btn-tertiary !min-h-0"
            >
              Tapvyo
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}
