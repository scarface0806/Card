'use client';

/**
 * DEMO PROFILE — the sample of the free profile site included with every card.
 *
 * Rebuilt on the Tapvyo design system (.tv-* in globals.css), so it now shares
 * one type scale, one button hierarchy, one form vocabulary and one set of
 * surfaces with the rest of the frontend.
 *
 * Three things are deliberately gone:
 *   - ~900 lines of page-local CSS that duplicated the system with a second
 *     palette (#33cc33 green, #FFD700 gold) and a second type scale;
 *   - the light/dark switch, which wrote `data-theme` onto <html> and a
 *     `preview-theme` key into localStorage. The system has one ground with
 *     bone sections cut into it, so there was nothing left for it to toggle;
 *   - the full-viewport particle canvas that spawned confetti on every mouse
 *     move — an animation loop running forever behind a page whose job is to
 *     show a customer what their profile looks like.
 *
 * The Font Awesome CDN import went with them; icons come from lucide-react,
 * which the rest of the site already uses.
 */

import {
  ADDRESS,
  PHONE_DISPLAY,
  PHONE_E164,
  SUPPORT_EMAIL,
  SITE_URL,
  whatsappLink,
} from '@/lib/site-config';

import { useState } from 'react';
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
  Phone,
} from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success' }
  | { status: 'error'; message: string };

/* Channels the demo profile exposes. Instagram, Facebook and LinkedIn are the
   confirmed profiles from site-config; WhatsApp and the website round out the
   row a real profile would show. */
const CHANNELS = [
  { name: 'WhatsApp', href: whatsappLink(), icon: MessageCircle },
  { name: 'Instagram', href: 'https://www.instagram.com/tapvyo', icon: Instagram },
  { name: 'Facebook', href: 'https://www.facebook.com/tapvyo', icon: Facebook },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/tapvyo', icon: Linkedin },
  { name: 'Website', href: SITE_URL, icon: Globe },
];

const WORKS = [
  {
    title: 'Premium NFC Card',
    detail: 'Matte black edition',
    src: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=600&fit=crop',
    alt: 'A matte black NFC business card resting on a dark surface',
  },
  {
    title: 'Analytics Dashboard',
    detail: 'Real-time insights',
    src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    alt: 'A laptop screen showing charts and usage statistics',
  },
  {
    title: 'Digital Profile',
    detail: 'Custom website',
    src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    alt: 'A tablet and laptop displaying a digital profile layout',
  },
  {
    title: 'Corporate Solution',
    detail: 'Enterprise NFC',
    src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&h=600&fit=crop',
    alt: 'Colleagues reviewing printed material across a meeting table',
  },
  {
    title: 'Event Networking',
    detail: 'Conference cards',
    src: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop',
    alt: 'Two people shaking hands at a networking event',
  },
  {
    title: 'Brand Identity',
    detail: 'Custom designs',
    src: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=600&fit=crop',
    alt: 'A set of branded stationery laid out on a desk',
  },
];

const CONTACT_ROWS = [
  {
    icon: Phone,
    label: 'Phone',
    value: PHONE_DISPLAY,
    href: `tel:${PHONE_E164}`,
    external: false,
  },
  {
    icon: Mail,
    label: 'Email',
    value: SUPPORT_EMAIL,
    href: `mailto:${SUPPORT_EMAIL}`,
    external: false,
  },
  {
    icon: MapPin,
    label: 'Location',
    value: ADDRESS.full,
    href: `https://maps.google.com/?q=${encodeURIComponent(ADDRESS.full)}`,
    external: true,
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6 },
};

export default function PreviewWebsitePage() {
  // The Send Message form used to have no onSubmit at all - it looked
  // interactive and silently threw every enquiry away.
  const [submitState, setSubmitState] = useState<SubmitState>({ status: 'idle' });

  const handleContactSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setSubmitState({ status: 'submitting' });
    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('fullname') ?? ''),
          email: String(data.get('email') ?? ''),
          phone: String(data.get('phone') ?? ''),
          subject: String(data.get('subject') ?? ''),
          message: String(data.get('message') ?? ''),
        }),
      });

      // The API returns the reason under `error` and mirrors it under
      // `message`; reading only `message` lost the validation detail.
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.message || 'Could not send your message. Please try again.'
        );
      }

      form.reset();
      setSubmitState({ status: 'success' });
    } catch (error) {
      setSubmitState({
        status: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'Could not send your message. Please try again.',
      });
    }
  };

  const isSubmitting = submitState.status === 'submitting';

  return (
    <div className="min-h-screen bg-[#070A09]">
      {/* DEMO FRAME — says what the page is before the stock photography can
          imply otherwise, and gives the one route out of the demo. */}
      <div className="tv-demobar">
        <div className="site-container">
          <div className="tv-demobar-bar">
            {/* At 320px the logo, the notice and the CTA cannot all fit on one
                line, and the notice is the part that has to survive: it is the
                only thing telling the visitor this is not a real profile. */}
            <div className="flex items-center gap-3 sm:gap-5 min-w-0">
              <span className="hidden sm:block">
                <BrandLogo size="small" variant="light" />
              </span>
              <span className="tv-tag tv-tag-brass shrink-0">Demo</span>
              <p className="tv-small hidden md:block truncate">
                An example profile. Content and images are placeholders.
              </p>
            </div>

            <a href="/create-card" className="tv-btn tv-btn-primary shrink-0">
              Create yours
              <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <main>
        {/* IDENTITY — the portrait and the name are the page. Everything the
            old hero fought over (badge, toggle, confetti) is gone. */}
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
                    src="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&h=1000&fit=crop"
                    alt="Tapvyo brand portrait"
                    width={800}
                    height={1000}
                    decoding="async"
                  />
                </div>
                <p className="tv-mono mt-4">Tiruchirappalli · Tamil Nadu · India</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="lg:col-span-7"
              >
                <p className="tv-eyebrow mb-6">Digital profile</p>
                <h1 className="tv-display mb-4">Tapvyo Admin</h1>
                <p className="tv-lead mb-8 tv-measure-lead">
                  Tapvyo — NFC Digital Solutions
                </p>

                <ul className="tv-tag-row mb-9">
                  <li>NFC Smart Cards</li>
                  <li>Digital Profiles</li>
                  <li>Custom Portfolios</li>
                </ul>

                <div className="flex flex-col sm:flex-row gap-3 mb-9">
                  <a href="#contact" className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block">
                    Get in touch
                    <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                  </a>
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tv-btn tv-btn-lg tv-btn-secondary tv-btn-block"
                  >
                    Chat on WhatsApp
                  </a>
                </div>

                <ul className="flex flex-wrap gap-3">
                  {CHANNELS.map(({ name, href, icon: Icon }) => (
                    <li key={name}>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tv-iconlink tv-focus"
                        aria-label={`${name} (opens in a new tab)`}
                      >
                        <Icon className="w-[18px] h-[18px]" strokeWidth={1.7} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ABOUT — one column of copy against a sticky heading, the same
            editorial pairing /how-to-use and /services use. */}
        <section className="tv-surface-graphite tv-section-tight">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              <motion.div {...fadeInUp} className="lg:col-span-4">
                <div className="lg:sticky lg:top-28">
                  <p className="tv-eyebrow mb-6">About</p>
                  <h2 className="tv-h2">One tap, one identity.</h2>
                </div>
              </motion.div>

              <motion.div
                {...fadeInUp}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-8"
              >
                <p className="tv-lead tv-measure-body mb-6">
                  Tapvyo is a modern digital solutions company specialising in NFC-powered
                  smart business cards and digital profiles.
                </p>
                <p className="tv-body tv-measure-body">
                  We help businesses and professionals share their identity with a single
                  tap — no apps needed. From premium NFC cards to custom digital
                  portfolios, we craft seamless experiences that make networking
                  effortless and memorable.
                </p>

                <hr className="tv-rule my-9" />

                <div className="tv-spec">
                  <p className="tv-spec-row">Programmed NFC chip — works on any modern phone</p>
                  <p className="tv-spec-row">Profile you can edit long after the card is printed</p>
                  <p className="tv-spec-row">Shareable link and QR code for anyone without NFC</p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* WORK — a gallery on the dark ground. The gradient overlays that sat
            on top of every photograph are replaced by a caption on a hairline,
            so the image is the image and the label is legible. */}
        <section className="tv-surface-ink tv-section" id="works">
          <div className="site-container">
            <motion.div {...fadeInUp} className="max-w-2xl mb-12 md:mb-16">
              <p className="tv-eyebrow mb-6">Portfolio</p>
              <h2 className="tv-h2 mb-4">Selected work.</h2>
              <p className="tv-lead tv-measure-body">
                A glimpse of our NFC cards and digital solutions.
              </p>
            </motion.div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
              {WORKS.map((work, index) => (
                <motion.li
                  key={work.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.55, delay: (index % 3) * 0.08 }}
                >
                  <figure className="tv-figure">
                    <div className="tv-figure-media">
                      <img
                        src={work.src}
                        alt={work.alt}
                        width={800}
                        height={600}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <figcaption className="tv-figure-cap">
                      <div>
                        <h3 className="tv-h4">{work.title}</h3>
                        <p className="tv-small mt-1">{work.detail}</p>
                      </div>
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

        {/* CONTACT — on bone, matching /contact-us: the enquiry form is the one
            place on the site that reads as printed paper. The map keeps its
            natural colours here instead of glaring out of a dark section. */}
        <section className="tv-surface-bone tv-section" id="contact">
          <div className="site-container">
            <motion.div {...fadeInUp} className="max-w-2xl mb-12 md:mb-16">
              <p className="tv-eyebrow mb-6">Contact</p>
              <h2 className="tv-h2 mb-4">Let&apos;s build something great.</h2>
              <p className="tv-lead tv-measure-body">
                Questions about NFC cards or digital profiles? Send a message and our
                team will get back to you.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              {/* Details + map */}
              <motion.div {...fadeInUp} className="lg:col-span-5">
                <ul className="mb-10">
                  {CONTACT_ROWS.map(({ icon: Icon, label, value, href, external }) => (
                    <li
                      key={label}
                      className="flex items-start gap-4 py-4 border-b border-black/10"
                    >
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6E5518]/10"
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4 text-[#6E5518]" strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0">
                        <span className="tv-mono block mb-1">{label}</span>
                        <a
                          href={href}
                          className="tv-btn-tertiary !min-h-0 break-words"
                          {...(external
                            ? { target: '_blank', rel: 'noopener noreferrer' }
                            : {})}
                        >
                          {value}
                        </a>
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="tv-embed">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d125323.41844138754!2d78.61970684999999!3d10.804972749999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3baaf50ff2aab12f%3A0xb20657c7e2b3eab9!2sTiruchirappalli%2C%20Tamil%20Nadu!5e0!3m2!1sen!2sin!4v1710744000000!5m2!1sen!2sin"
                    height={300}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Map showing our location in Tiruchirappalli, Tamil Nadu"
                  />
                </div>
              </motion.div>

              {/* Form. Placeholder-only labels are gone: every field now has a
                  real <label> above it, as on /contact-us. */}
              <motion.div
                {...fadeInUp}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="lg:col-span-7"
              >
                <div className="tv-panel tv-panel-pad">
                  <form onSubmit={handleContactSubmit}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                      <div className="tv-field">
                        <label htmlFor="pw-fullname" className="tv-label">
                          Your name<span className="tv-label-req">*</span>
                        </label>
                        <input
                          id="pw-fullname"
                          type="text"
                          name="fullname"
                          placeholder="Priya Raman"
                          autoComplete="name"
                          required
                          className="tv-input"
                        />
                      </div>

                      <div className="tv-field">
                        <label htmlFor="pw-phone" className="tv-label">
                          Phone<span className="tv-label-req">*</span>
                        </label>
                        <input
                          id="pw-phone"
                          type="tel"
                          name="phone"
                          placeholder="9876543210"
                          inputMode="tel"
                          autoComplete="tel"
                          maxLength={10}
                          required
                          className="tv-input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5">
                      <div className="tv-field">
                        <label htmlFor="pw-email" className="tv-label">
                          Email<span className="tv-label-req">*</span>
                        </label>
                        <input
                          id="pw-email"
                          type="email"
                          name="email"
                          placeholder="your@email.com"
                          inputMode="email"
                          autoComplete="email"
                          required
                          className="tv-input"
                        />
                      </div>

                      <div className="tv-field">
                        <label htmlFor="pw-subject" className="tv-label">
                          Subject
                        </label>
                        <input
                          id="pw-subject"
                          type="text"
                          name="subject"
                          placeholder="NFC card enquiry"
                          className="tv-input"
                        />
                      </div>
                    </div>

                    <div className="tv-field">
                      <label htmlFor="pw-message" className="tv-label">
                        Message<span className="tv-label-req">*</span>
                      </label>
                      <textarea
                        id="pw-message"
                        name="message"
                        placeholder="Tell us what you need…"
                        rows={5}
                        required
                        className="tv-textarea"
                      />
                    </div>

                    <div className="mt-7">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Sending…' : 'Send message'}
                        {!isSubmitting && (
                          <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                        )}
                      </button>

                      {/* Outcome is both visible and announced. */}
                      <div aria-live="polite">
                        {submitState.status === 'success' ? (
                          <p className="tv-form-success mt-4">
                            Thanks — your message has been sent. We will reply shortly.
                          </p>
                        ) : null}
                        {submitState.status === 'error' ? (
                          <p className="tv-form-error mt-4" role="alert">
                            {submitState.message}
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

        {/* CLOSE — the demo's own sign-off. It is the customer's footer in the
            real thing, so it stays small and carries the one CTA. */}
        <section className="tv-surface-graphite tv-section-tight">
          <div className="site-container">
            <motion.div
              {...fadeInUp}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end border-t border-[#C9A961]/25 pt-12"
            >
              <div className="lg:col-span-7">
                <h2 className="tv-h2 mb-4">This profile comes free with your card.</h2>
                <p className="tv-body tv-measure-body">
                  Every Tapvyo NFC card includes a profile like this one — yours to edit
                  whenever your details change.
                </p>
              </div>

              <div className="lg:col-span-5 lg:justify-self-end">
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/create-card"
                    className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block"
                  >
                    Create yours
                    <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                  </a>
                  <a href="/cards" className="tv-btn tv-btn-lg tv-btn-secondary tv-btn-block">
                    View card designs
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="tv-surface-graphite border-t border-[#F1F3F1]/10">
        <div className="site-container py-8">
          <p className="tv-small">
            © {new Date().getFullYear()} All rights reserved. Designed &amp; developed by{' '}
            <a
              href={SITE_URL}
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
