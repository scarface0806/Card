'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '@/utils/constants';
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

  const isActive = (href: string) => pathname === href;

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#020617]/90 backdrop-blur-2xl shadow-lg shadow-black/30 border-b border-[#1f2937]'
          : 'bg-[#020617]/65 backdrop-blur-xl border-b border-transparent'
      }`}
    >
      <div className="site-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-3 group">
            <BrandLogo size="medium" />
          </Link>

          {/* Desktop Menu - Center */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-slate-300 hover:text-primary hover:bg-primary/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Contact Now - WhatsApp CTA Button */}
            <a
              href="https://wa.me/917871361025?text=Hi%20I%20want%20a%20NFC%20digital%20business%20card"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-primary bg-transparent border border-primary rounded-full transition-all duration-300 hover:bg-primary/10 hover:shadow-md group"
            >
              <span>Contact Now</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2.5 text-slate-100 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
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
              className="lg:hidden absolute top-full left-0 right-0 bg-[#0b1220]/95 backdrop-blur-xl border-t border-primary/20 shadow-lg"
            >
              <div className="container mx-auto max-w-7xl px-4 py-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                      isActive(link.href)
                        ? 'text-primary bg-primary/10 border-l-2 border-primary'
                        : 'text-slate-200 hover:text-primary hover:bg-primary/10'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 space-y-3 border-t border-primary/10 mt-4">
                  <a
                    href="https://wa.me/917871361025?text=Hi%20I%20want%20a%20NFC%20digital%20business%20card"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-primary bg-transparent border border-primary rounded-full transition-all duration-300 font-semibold hover:bg-primary/10 hover:shadow-md group"
                  >
                    <span>Contact Now</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
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
