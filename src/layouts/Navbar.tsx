'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight, Wifi, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '@/utils/constants';

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
          ? 'bg-white/80 backdrop-blur-2xl shadow-lg shadow-black/[0.03] border-b border-gray-200/60'
          : 'bg-transparent'
      }`}
    >
      <div className="site-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href={ROUTES.HOME} className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center shadow-md shadow-teal-500/20 group-hover:shadow-teal-500/30 transition-shadow duration-300">
              <Wifi className="w-5 h-5 text-white rotate-45" />
            </div>
            <span className="text-xl font-bold text-[#0f2e25] font-space-grotesk tracking-tight">
              Tapvyo
            </span>
          </Link>

          {/* Desktop Menu - Center */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isActive(link.href)
                    ? 'text-teal-600 bg-teal-50/80'
                    : 'text-gray-600 hover:text-teal-600 hover:bg-gray-50'
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
              className="relative flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 overflow-hidden group"
            >
              {/* Shine effect overlay */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              <span className="relative">Contact Now</span>
              <ArrowRight className="relative w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2.5 text-[#0f2e25] rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors"
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
              className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-teal-100 shadow-lg"
            >
              <div className="container mx-auto max-w-7xl px-4 py-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`block px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                      isActive(link.href)
                        ? 'text-teal-600 bg-teal-50 border-l-2 border-teal-600'
                        : 'text-teal-800 hover:text-teal-600 hover:bg-teal-50'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="pt-4 space-y-3 border-t border-teal-100 mt-4">
                  <a
                    href="https://wa.me/917871361025?text=Hi%20I%20want%20a%20NFC%20digital%20business%20card"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-white bg-gradient-to-r from-green-600 to-emerald-500 rounded-full transition-all duration-300 font-medium shadow-md hover:shadow-lg group"
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
