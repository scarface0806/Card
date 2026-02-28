'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Wifi } from 'lucide-react';
import { ROUTES, SUPPORT_EMAIL, SUPPORT_PHONE } from '@/utils/constants';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0a1f1c] border-t border-teal-900/30">
      <div className="site-container section-spacing-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-12">
          {/* Brand */}
          <div>
            <Link href={ROUTES.HOME} className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center">
                <Wifi className="w-5 h-5 text-white rotate-45" />
              </div>
              <span className="heading-3 text-white font-space-grotesk">
                Tapvyo
              </span>
            </Link>
            <p className="body-base text-gray-400">
              Modern NFC Digital Business Card Platform. Share your professional presence with a single tap.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-white mb-4 font-space-grotesk">Services</h4>
            <ul className="space-y-3 text-gray-300">
              <li>
                <Link href="/services" className="hover:text-teal-400 transition-colors">
                  All Services
                </Link>
              </li>
              <li>
                <Link href={ROUTES.CARDS} className="hover:text-teal-400 transition-colors">
                  NFC Cards
                </Link>
              </li>
              <li>
                <Link href={ROUTES.ORDER} className="hover:text-teal-400 transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-white mb-4 font-space-grotesk">Support</h4>
            <ul className="space-y-3 text-gray-300">
              <li>
                <Link href={ROUTES.CONTACT} className="hover:text-teal-400 transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href={ROUTES.PRIVACY} className="hover:text-teal-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={ROUTES.TERMS} className="hover:text-teal-400 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4 font-space-grotesk">Contact</h4>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-teal-400" />
                </div>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-teal-400 transition-colors">
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-teal-400" />
                </div>
                <a href={`tel:${SUPPORT_PHONE}`} className="hover:text-teal-400 transition-colors">
                  {SUPPORT_PHONE}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-teal-600/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-teal-400" />
                </div>
                <span>India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            &copy; {currentYear} Tapvyo. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors text-sm">
              Twitter
            </a>
            <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors text-sm">
              LinkedIn
            </a>
            <a href="#" className="text-gray-400 hover:text-teal-400 transition-colors text-sm">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
