'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '@/utils/constants';
import { whatsappLink } from '@/lib/site-config';
import BrandLogo from '@/components/common/BrandLogo';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/how-to-use' },
    { label: 'Cards', href: '/cards' },
    { label: 'Services', href: '/services' },
    { label: 'Contact', href: '/contact-us' },
  ];

  const isActive = (href: string) => {
    const hrefPath = href.split('#')[0] || '/';
    if (hrefPath === '/') return pathname === '/';
    return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#070A09]/92 backdrop-blur-2xl border-b border-[#F1F3F1]/10'
          : 'bg-[#070A09]/60 backdrop-blur-xl border-b border-transparent'
      }`}
    >
      <div className="site-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex min-h-[44px] items-center gap-3 group">
            <BrandLogo size="medium" />
          </Link>

          {/* Desktop Menu - Center */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(link.href)
                      ? 'text-[#4CAE89] bg-[#4CAE89]/10 border border-[#4CAE89]/30'
                      : 'text-[#A9B5B0] hover:text-[#F1F3F1] hover:bg-[#F1F3F1]/10 border border-transparent'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {/* WhatsApp enquiry. Tertiary tier: no arrow - that glyph is reserved for the primary "Get your card" action. */}
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="tv-btn tv-btn-secondary"
            >
              <span>Talk to our team</span>
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="tv-focus lg:hidden flex h-11 w-11 items-center justify-center text-[#F1F3F1] rounded-xl bg-[#F1F3F1]/10 hover:bg-[#F1F3F1]/20 transition-colors border border-[#F1F3F1]/15"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden absolute top-full left-0 right-0 bg-[#151C1A]/97 backdrop-blur-xl border-t border-[#F1F3F1]/10"
            >
              <div className="container mx-auto max-w-7xl px-4 py-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                      isActive(link.href)
                        ? 'text-[#4CAE89] bg-[#4CAE89]/10 border-l-2 border-[#4CAE89]'
                        : 'text-[#A9B5B0] hover:text-[#F1F3F1] hover:bg-[#F1F3F1]/10'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 space-y-3 border-t border-[#F1F3F1]/10 mt-4">
                  <a
                    href={whatsappLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="tv-btn tv-btn-secondary tv-btn-block w-full"
                  >
                    <span>Talk to our team</span>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}
