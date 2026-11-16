'use client';

import { usePathname } from 'next/navigation';
import { WhatsAppIcon } from '@/components/icons/BrandIcons';
import { WHATSAPP_FLOATING_MESSAGE, whatsappLink } from '@/lib/site-config';

/**
 * Floating WhatsApp button, bottom-right on every public page.
 *
 * NOT shown on:
 *  - /admin and /dashboard: internal screens, not a sales surface.
 *  - /card/<slug>: a CUSTOMER's public profile. A Tapvyo chat button there
 *    would sit on someone else's page and compete with their own WhatsApp
 *    link, which is the one a visitor actually wants.
 *  - /preview-website: the demo of that same customer profile, kept faithful.
 *
 * On the homepage it sits higher on mobile, above StickyMobileCTA (a fixed
 * full-width bar, lg:hidden), so it never covers the "Get your card" button.
 *
 * z-40, below the modals (z-50), so an open dialog always covers it.
 * Clicks are reported as whatsapp_click with location "floating_button" by the
 * delegated listener in lib/analytics.ts, via the data attribute.
 */
const HIDDEN_PREFIXES = ['/admin', '/dashboard', '/card/', '/preview-website'];

export default function FloatingWhatsApp() {
  const pathname = usePathname() ?? '';

  if (HIDDEN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`))) {
    return null;
  }

  const clearsStickyBar = pathname === '/';

  return (
    <a
      href={whatsappLink(WHATSAPP_FLOATING_MESSAGE)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Tapvyo on WhatsApp (opens in a new tab)"
      title="Chat with us on WhatsApp"
      data-analytics-location="floating_button"
      className={`tv-focus fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transition-none lg:right-6 lg:bottom-6 ${
        clearsStickyBar ? 'bottom-[92px]' : 'bottom-4'
      }`}
    >
      <WhatsAppIcon className="h-7 w-7" aria-hidden="true" />
    </a>
  );
}
