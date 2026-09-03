'use client';

import Navbar from '@/layouts/Navbar';
import Footer from '@/layouts/Footer';
import { motion } from 'framer-motion';
import { User, Globe, Wifi, ArrowUpRight, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/utils/constants';
import { PHONE_DISPLAY, whatsappLink } from '@/lib/site-config';

export default function HowToUsePage() {
  const steps = [
    {
      number: '01',
      title: 'Send us your details',
      description:
        'Your name, bio, social links, contact details and business information. That is everything we need to build your profile.',
      icon: User,
      note: null,
    },
    {
      number: '02',
      title: 'We build your profile site',
      description:
        'A fully responsive profile page showing your bio, services, social links and more — completely free and valid for lifetime.',
      icon: Globe,
      // The one place this page makes the lifetime-website claim.
      note: 'free-website' as const,
    },
    {
      number: '03',
      title: 'We program your card',
      description:
        'We securely encode your profile link into the NFC chip. Someone taps the card on their phone and your profile opens instantly.',
      icon: Wifi,
      note: 'No app required. Just tap and share.',
    },
  ];

  const audience = ['Entrepreneurs', 'Executives', 'Creators', 'Business Leaders'];

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <>
      <Navbar />
      <main>
        {/* HERO — left-aligned on ink. The old centred badge / two-tone
            heading / grey subtitle stack is gone. */}
        <section className="tv-hero pt-32 pb-16 md:pt-44 md:pb-24">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="lg:col-span-7"
              >
                <p className="tv-eyebrow mb-7">How it works</p>
                <h1 className="tv-display mb-6" style={{ maxWidth: '18ch' }}>
                  You send three things. We do the rest.
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="lg:col-span-5 lg:pb-3"
              >
                <p className="tv-lead">
                  A modern way to share your professional identity instantly — and a
                  profile we keep online long after the card is printed.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* STEPS — the spine of the page, set on paper as a drawn timeline.
            This is the page's one light section. */}
        <section className="tv-surface-bone tv-section">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
              <motion.div {...fadeInUp} className="lg:col-span-4">
                <div className="lg:sticky lg:top-32">
                  <p className="tv-eyebrow mb-6">The process</p>
                  <h2 className="tv-h2 mb-4">From your details to a card in hand.</h2>
                  <p className="tv-body tv-measure-body">
                    You only do step one. Steps two and three are ours.
                  </p>
                </div>
              </motion.div>

              <div className="lg:col-span-8">
                <ol className="tv-flow">
                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    return (
                      <motion.li
                        key={step.number}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.55, delay: index * 0.1 }}
                        className="tv-flow-item"
                      >
                        <span className="tv-flow-marker" aria-hidden="true">
                          {step.number}
                        </span>

                        <div className="pt-1 md:pt-4">
                          <Icon
                            className="w-5 h-5 mb-4 text-[#6E5518]"
                            strokeWidth={1.6}
                            aria-hidden="true"
                          />
                          <h3 className="tv-h3 mb-3">{step.title}</h3>
                          <p className="tv-body tv-measure-body">{step.description}</p>

                          {step.note === 'free-website' ? (
                            <span className="tv-flow-note">
                              <a
                                href="/preview-website"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="tv-btn-tertiary !min-h-0"
                              >
                                Free Lifetime Website
                              </a>{' '}
                              included
                            </span>
                          ) : step.note ? (
                            <span className="tv-flow-note">{step.note}</span>
                          ) : null}
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* PROFILE UPDATES — sits directly after the three steps because it is
            what happens next. Deliberately explicit: there is no self-serve
            editor, and an update is a paid request. */}
        <section className="tv-surface-ink tv-section-tight">
          <div className="site-container">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
              <motion.div {...fadeInUp} className="lg:col-span-5">
                <p className="tv-eyebrow mb-6">Profile updates</p>
                <h2 className="tv-h2 mb-4">Changed a detail? We update it for you.</h2>
                <p className="tv-body tv-measure-body">
                  Updates are handled by the Tapvyo team, not from a dashboard. Your
                  card is never reprinted — the link encoded on the chip stays the
                  same, so only the page behind it changes.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="lg:col-span-7"
              >
                <ul className="tv-spec">
                  <li className="tv-spec-row">
                    Send your change request on WhatsApp ({PHONE_DISPLAY}) — tell us
                    which fields to change and what they should say
                  </li>
                  <li className="tv-spec-row">Each update request is ₹49</li>
                  {/* TODO: confirm the real turnaround before launch. The
                      wording below is a placeholder - do not ship unverified. */}
                  <li className="tv-spec-row">
                    Your profile is updated within 1 working day [CONFIRM]
                  </li>
                </ul>

                <a
                  href={whatsappLink('Hi, I want to update my Tapvyo profile details')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tv-btn tv-btn-lg tv-btn-primary tv-btn-block sm:!w-auto mt-8"
                >
                  <MessageCircle className="w-[18px] h-[18px]" aria-hidden="true" />
                  Request an update
                  <span className="sr-only"> (opens WhatsApp in a new tab)</span>
                </a>
              </motion.div>
            </div>
          </div>
        </section>

        {/* WHO IT IS FOR — a quiet spec row. The four emoji tiles are gone. */}
        <section className="tv-surface-graphite tv-section-tight">
          <div className="site-container">
            <motion.div {...fadeInUp} className="max-w-2xl mb-10 md:mb-12">
              <h2 className="tv-h2 mb-4">Built for people who hand out their name.</h2>
              <p className="tv-lead tv-measure-body">
                Share your bio, services and contact details in one tap.
              </p>
            </motion.div>

            <motion.ul
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="tv-tag-row"
            >
              {audience.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </motion.ul>
          </div>
        </section>

        {/* CLOSE — the two stacked CTA sections are merged into one.
            All three original destinations are preserved, one per tier. */}
        <section className="tv-surface-ink tv-section">
          <div className="site-container">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-end border-t border-[#C9A961]/25 pt-12 md:pt-16"
            >
              <div className="lg:col-span-7">
                <h2 className="tv-h2 mb-4">Ready when you are.</h2>
                <p className="tv-body tv-measure-body">
                  Order your NFC card today. Send us your details and we build the
                  profile for you.
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="flex flex-col sm:flex-row lg:justify-end gap-3">
                  <Link
                    href={ROUTES.CREATE_CARD}
                    className="tv-btn tv-btn-lg tv-btn-gilded tv-btn-block"
                  >
                    Get your card
                    <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                  </Link>
                  <Link
                    href={ROUTES.CARDS}
                    className="tv-btn tv-btn-lg tv-btn-secondary tv-btn-block"
                  >
                    View card designs
                  </Link>
                </div>

                <p className="tv-small mt-5 lg:text-right">
                  Need something customised?{' '}
                  <Link href={ROUTES.CONTACT} className="tv-btn-tertiary !min-h-0">
                    Talk to our team
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
