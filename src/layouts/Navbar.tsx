'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowUpRight, Wifi, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '@/utils/constants';
import AuthModal from '@/components/AuthModal';

type AuthMode = 'login' | 'signup';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
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
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl shadow-md border-b border-teal-100'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto max-w-7xl px-4 lg:px-8">
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
                className={`px-4 py-2 text-sm font-medium transition-all duration-300 ${
                  isActive(link.href)
                    ? 'text-teal-600 border-b-2 border-teal-600'
                    : 'text-teal-800 hover:text-teal-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Login - Text Button with Underline Animation */}
            <button
              onClick={() => {
                setAuthMode('login');
                setIsAuthOpen(true);
              }}
              className="relative text-sm font-medium text-teal-700 hover:text-teal-900 transition-all duration-300 group py-2"
            >
              Login
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-teal-600 group-hover:w-full transition-all duration-300 ease-out" />
            </button>

            {/* Signup - Primary Gradient Button with Arrow */}
            <motion.button
              onClick={() => {
                setAuthMode('signup');
                setIsAuthOpen(true);
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="relative flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-green-600 rounded-full transition-all duration-300 shadow-md hover:shadow-lg overflow-hidden group"
            >
              {/* Shine effect overlay */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
              <span className="relative">Sign Up</span>
              <ArrowRight className="relative w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>
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
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setIsAuthOpen(true);
                      setIsOpen(false);
                    }}
                    className="w-full px-4 py-3 text-center text-teal-700 font-medium hover:text-teal-900 rounded-xl transition-all duration-300 border border-teal-200 hover:border-teal-300 hover:bg-teal-50"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('signup');
                      setIsAuthOpen(true);
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 text-center text-white bg-gradient-to-r from-teal-600 to-green-600 rounded-full transition-all duration-300 font-medium shadow-md hover:shadow-lg group"
                  >
                    <span>Sign Up</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        mode={authMode}
        onClose={() => setIsAuthOpen(false)}
        onModeChange={setAuthMode}
      />
    </nav>
  );
}
