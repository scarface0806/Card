'use client';

import { useState, useEffect, type MouseEvent } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '@/utils/constants';
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

  /**
   * Same-page logo press: scroll to the top instead of a no-op navigation.
   *
   * Only intercepts when the current route already IS the logo's target -
   * every other case falls through to Next's normal navigation, which scrolls
   * to the top on its own.
   *
   * Honours prefers-reduced-motion: a smooth scroll of a long page is exactly
   * the kind of large motion that setting exists to suppress.
   */
  const scrollToTop = (event: MouseEvent<HTMLAnchorElement>) => {
    // Let modified clicks (new tab, new window) behave normally.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    event.preventDefault();
    setIsOpen(false);

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  };

  const handleLogoClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (pathname !== ROUTES.HOME) return;
    scrollToTop(event);
  };

  /**
   * Same-page nav link press, e.g. "Cards" while already on /cards.
   *
   * A hash link is left alone: "/#features" from the home page must jump to
   * that section, and hijacking it to scroll to the top would break the one
   * link on this list whose whole purpose is to move somewhere specific.
   */
  const handleNavLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.includes('#')) return;
    if (pathname !== href) return;
    scrollToTop(event);
  };

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
          {/* Wordmark. Clicking it from another page navigates home as usual.
              Clicking it while ALREADY on the target page used to do nothing
              at all - Next skips a navigation to the current route, so someone
              scrolled down to the cards section on the home page pressed the
              logo and the page did not move. A logo is expected to take you
              back to the top, so that case scrolls instead. */}
          <Link
            href={ROUTES.HOME}
            onClick={handleLogoClick}
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
                  onClick={(event) => handleNavLinkClick(event, link.href)}
                  className="tv-navlink tv-focus"
                  aria-current={isActive(link.href) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions. Two tiers: the outline account action and the one
              primary CTA. The arrow glyph belongs to the primary tier alone.
              The WhatsApp "Talk to our team" button that used to sit here was
              removed; Login now occupies that slot, styled as the outline
              tier so the CTA hierarchy is unchanged. WhatsApp is still
              reachable from the footer and every profile page. */}
          <div className="hidden lg:flex items-center gap-3">
            <AccountMenu />
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
                        onClick={(event) => {
                          setIsOpen(false);
                          handleNavLinkClick(event, link.href);
                        }}
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
                </div>

                {/* Account, below the primary CTA so "Get your card" stays the
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
