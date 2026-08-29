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
    <footer className="bg-[#0B1220] border-t border-[#1F2937]">
      <div className="site-container section-spacing-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16">
          {/* Brand */}
          <div>
            <Link href={ROUTES.HOME} className="flex items-center gap-3 mb-4">
              <BrandLogo size="medium" variant="light" />
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Modern NFC Digital Business Card Platform. Share your professional presence with a single tap.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4 font-space-grotesk">Services</h4>
            <ul className="space-y-3 text-slate-300">
              <li>
                <Link href="/services" className="hover:text-primary transition-colors">
                  All Services
                </Link>
              </li>
              <li>
                <Link href={ROUTES.CARDS} className="hover:text-primary transition-colors">
                  NFC Cards
                </Link>
              </li>
              <li>
                <Link href={ROUTES.ORDER} className="hover:text-primary transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4 font-space-grotesk">Support</h4>
            <ul className="space-y-3 text-slate-300">
              <li>
                <Link href={ROUTES.CONTACT} className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href={ROUTES.PRIVACY} className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={ROUTES.TERMS} className="hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 font-space-grotesk">Contact</h4>
            <ul className="space-y-3 text-slate-300">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-primary transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <a href={`tel:${PHONE_E164}`} className="hover:text-primary transition-colors">
                  {PHONE_DISPLAY}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <span>{ADDRESS.full}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1F2937] pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
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
                    className="inline-flex items-center min-h-[44px] text-slate-400 hover:text-primary focus-visible:text-primary transition-colors text-sm"
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

