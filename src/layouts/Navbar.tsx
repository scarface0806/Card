'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '@/utils/constants';
import { whatsappLink } from '@/lib/site-config';
import BrandLogo from '@/components/common/BrandLogo';
import AccountMenu from '@/components/common/AccountMenu';

const NAV_LINKS = [
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/how-to-use' },
  { label: 'Cards', href: '/cards' },
  { label: 'Services', href: '/services' },
  { label: 'About', href: '/about-us' },
  { label: 'Contact', href: '/contact-us' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    // Read once on mount: on a page restored mid-scroll the header used to
    // paint in its transparent state until the first scroll event.
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigating with the panel open left it covering the new page. Adjusted
  // during render rather than in an effect: an effect would paint the new page
  // once with the menu still over it before closing it, and back/forward
  // navigation has no click handler to close it.
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setIsOpen(false);
  }

  // Escape closes the panel, and the page behind it does not scroll while it
  // is open.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  const isActive = (href: string) => {
    const hrefPath = href.split('#')[0] || '/';
    if (hrefPath === '/') return pathname === '/';
    return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  };

  return (
    <nav
      aria-label="Main"
      className={`tv-nav ${scrolled ? 'tv-nav-scrolled' : 'tv-nav-rest'}`}
    >
      <div className="site-container">
        <div className="tv-nav-bar">
          {/* Wordmark */}
          <Link
            href={ROUTES.HOME}
            className="tv-focus flex min-h-[44px] items-center"
            aria-label="Tapvyo — home"
          >
            <BrandLogo size="medium" />
          </Link>

          {/* Desktop navigation */}
          <ul className="hidden lg:flex items-center">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="tv-navlink tv-focus"
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions. Two button tiers only: the outline enquiry and the one
              primary action. The arrow glyph belongs to the primary tier
              alone. The account control sits BEFORE both and is drawn as a
              navlink or an avatar, never as a third button - adding a third
              tier here is what would flatten the CTA hierarchy. */}
          <div className="hidden lg:flex items-center gap-3">
            <AccountMenu />
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="tv-btn tv-btn-secondary"
            >
              Talk to our team
              <span className="sr-only"> (opens WhatsApp in a new tab)</span>
            </a>
            <Link href={ROUTES.CREATE_CARD} className="tv-btn tv-btn-gilded">
              Get your card
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="tv-nav-toggle tv-focus inline-flex lg:hidden"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
            aria-controls="mobile-menu"
          >
            {isOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile panel. A numbered index rather than a stack of tinted rows -
          the same shape as the numbered lists used elsewhere on the site. */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="scrim"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="tv-nav-scrim lg:hidden"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <motion.div
              key="panel"
              id="mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="tv-nav-panel lg:hidden"
            >
              <div className="site-container py-6">
                <ul>
                  {NAV_LINKS.map((link, index) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="tv-nav-mobile-link tv-focus"
                        aria-current={isActive(link.href) ? 'page' : undefined}
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="tv-nav-mobile-num" aria-hidden="true">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 space-y-3">
                  <Link
                    href={ROUTES.CREATE_CARD}
                    onClick={() => setIsOpen(false)}
                    className="tv-btn tv-btn-gilded w-full"
                  >
                    Get your card
                    <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="tv-btn tv-btn-secondary w-full"
                  >
                    Talk to our team
                    <span className="sr-only"> (opens WhatsApp in a new tab)</span>
                  </a>
                </div>

                {/* Account, below the two CTAs so the primary action stays the
                    first thing in the panel. */}
                <AccountMenu variant="mobile" onNavigate={() => setIsOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
