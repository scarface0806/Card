'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/utils/constants';
import { whatsappLink } from '@/lib/site-config';

export default function PremiumNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { label: 'Features', href: '/#features' },
    { label: 'How It Works', href: '/how-to-use' },
    { label: 'Cards', href: '/cards' },
    { label: 'Contact', href: '/contact-us' },
  ];

  const isActive = (href: string) => {
    const hrefPath = href.split('#')[0] || '/';
    if (hrefPath === '/') return pathname === '/';
    return pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#020617]/90 backdrop-blur-xl border-b border-white/10 shadow-sm">
      <div className="site-container py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href={ROUTES.HOME} className="flex items-center gap-3 z-10 group">
          <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg group-hover:shadow-primary-glow transition-all duration-200" />
          <span className="font-bold text-xl text-white tracking-tight font-[family-name:var(--font-space-grotesk)]">Tapvyo</span>
        </Link>

        {/* Desktop Navigation - Center Aligned */}
        <div className="hidden md:flex items-center justify-center gap-1 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-all duration-200 font-[family-name:var(--font-space-grotesk)] ${
                isActive(item.href)
                  ? 'text-green-400 bg-green-500/10 border border-green-500/30'
                  : 'text-slate-300 hover:text-green-400 hover:bg-green-500/10 border border-transparent'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-4 z-10">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm relative overflow-hidden font-[family-name:var(--font-space-grotesk)] group"
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
            <span className="relative">Contact Now</span>
            <ArrowRight className="relative w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
          </a>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden z-10 text-white p-2.5 rounded-lg border border-white/10 bg-white/5"
          aria-label="Toggle menu"
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-[#0b1220]/95 backdrop-blur-xl border-b border-white/10 shadow-lg">
          <div className="px-4 py-6 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block text-sm font-medium py-3 px-4 rounded-lg transition-all duration-200 font-[family-name:var(--font-space-grotesk)] ${
                  isActive(item.href)
                    ? 'text-green-400 bg-green-500/10 border-l-2 border-green-400'
                    : 'text-slate-200 hover:text-green-400 hover:bg-green-500/10'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 space-y-3 border-t border-white/10">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="btn btn-primary btn-mobile-full font-[family-name:var(--font-space-grotesk)] group"
              >
                <span>Contact Now</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" />
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

