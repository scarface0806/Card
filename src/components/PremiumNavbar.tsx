'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/utils/constants';

export default function PremiumNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/how-to-use' },
    { label: 'Cards', href: '/cards' },
    { label: 'Contact', href: '/contact-us' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={ROUTES.HOME} className="flex items-center gap-3 z-10 group">
          <div className="w-9 h-9 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl shadow-lg group-hover:shadow-teal-500/25 transition-all duration-300" />
          <span className="font-bold text-xl text-teal-900 tracking-tight font-[family-name:var(--font-space-grotesk)]">Tapvyo</span>
        </Link>

        {/* Desktop Navigation - Center Aligned */}
        <div className="hidden md:flex items-center justify-center gap-1 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium px-4 py-2.5 transition-all duration-300 font-[family-name:var(--font-space-grotesk)] ${
                isActive(item.href)
                  ? 'text-teal-600 border-b-2 border-teal-600'
                  : 'text-teal-800 hover:text-teal-600'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4 z-10">
          <a
            href="https://wa.me/917871361025?text=Hi%20I%20want%20a%20NFC%20digital%20business%20card"
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 overflow-hidden font-[family-name:var(--font-space-grotesk)] group"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <span className="relative">Contact Now</span>
            <ArrowRight className="relative w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden z-10 text-teal-800 p-2"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white/98 backdrop-blur-xl border-b border-gray-100 shadow-lg">
          <div className="px-4 py-6 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block text-sm font-medium py-3 px-4 rounded-lg transition-all duration-300 font-[family-name:var(--font-space-grotesk)] ${
                  isActive(item.href)
                    ? 'text-teal-600 bg-teal-50 border-l-2 border-teal-600'
                    : 'text-teal-800 hover:text-teal-600 hover:bg-teal-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t border-gray-100">
              <a
                href="https://wa.me/917871361025?text=Hi%20I%20want%20a%20NFC%20digital%20business%20card"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-full transition-all duration-300 shadow-md hover:shadow-lg font-[family-name:var(--font-space-grotesk)] group"
              >
                <span>Contact Now</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

