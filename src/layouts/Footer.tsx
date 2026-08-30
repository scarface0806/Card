'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';
import { ROUTES } from '@/utils/constants';
import {
  ACTIVE_SOCIAL_PROFILES,
  ADDRESS,
  PHONE_DISPLAY,
  PHONE_E164,
  SITE_NAME,
  SUPPORT_EMAIL,
} from '@/lib/site-config';
import BrandLogo from '@/components/common/BrandLogo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="tv-surface-graphite border-t border-[#F1F3F1]/10">
      <div className="site-container section-spacing-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16">
          {/* Brand */}
          <div>
            <Link href={ROUTES.HOME} className="flex min-h-[44px] w-fit items-center gap-3 mb-4">
              <BrandLogo size="medium" variant="light" />
            </Link>
            <p className="tv-small tv-measure-body">
              Modern NFC Digital Business Card Platform. Share your professional presence with a single tap.
            </p>
          </div>

          {/* Services */}
          <div>
            <h2 className="tv-eyebrow mb-5">Services</h2>
            <ul className="space-y-1">
              <li>
                <Link href="/services" className="tv-small tv-focus inline-flex min-h-[44px] items-center hover:text-[#F1F3F1] transition-colors">
                  All Services
                </Link>
              </li>
              <li>
                <Link href={ROUTES.CARDS} className="tv-small tv-focus inline-flex min-h-[44px] items-center hover:text-[#F1F3F1] transition-colors">
                  NFC Cards
                </Link>
              </li>
              <li>
                <Link href={ROUTES.ORDER} className="tv-small tv-focus inline-flex min-h-[44px] items-center hover:text-[#F1F3F1] transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h2 className="tv-eyebrow mb-5">Support</h2>
            <ul className="space-y-1">
              <li>
                <Link href={ROUTES.CONTACT} className="tv-small tv-focus inline-flex min-h-[44px] items-center hover:text-[#F1F3F1] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href={ROUTES.PRIVACY} className="tv-small tv-focus inline-flex min-h-[44px] items-center hover:text-[#F1F3F1] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={ROUTES.TERMS} className="tv-small tv-focus inline-flex min-h-[44px] items-center hover:text-[#F1F3F1] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h2 className="tv-eyebrow mb-5">Contact</h2>
            <ul className="space-y-1">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C9A961]/15 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#C9A961]" />
                </div>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="tv-small tv-focus inline-flex min-h-[44px] items-center hover:text-[#F1F3F1] transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C9A961]/15 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#C9A961]" />
                </div>
                <a href={`tel:${PHONE_E164}`} className="tv-small tv-focus inline-flex min-h-[44px] items-center hover:text-[#F1F3F1] transition-colors">
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#C9A961]/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#C9A961]" />
                </div>
                <span className="tv-small">{ADDRESS.full}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#F1F3F1]/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="tv-small">
            &copy; {currentYear} {SITE_NAME}. All rights reserved.
          </p>
          {/* Only profiles with a confirmed URL are rendered - see
              ACTIVE_SOCIAL_PROFILES in site-config. An unconfirmed profile is
              omitted rather than linked to a bare homepage. */}
          {ACTIVE_SOCIAL_PROFILES.length > 0 && (
            <ul className="flex gap-6">
              {ACTIVE_SOCIAL_PROFILES.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tv-small tv-focus inline-flex items-center min-h-[44px] hover:text-[#F1F3F1] transition-colors"
                  >
                    {social.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </footer>
  );
}

