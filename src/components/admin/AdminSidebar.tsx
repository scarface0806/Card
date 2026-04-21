'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import BrandLogo from '@/components/common/BrandLogo';
import {
  BarChart3,
  Users,
  CreditCard,
  Package,
  ShoppingCart,
  Mail,
  MessageSquare,
  User,
  Lock,
  ChevronRight,
} from 'lucide-react';

const menuItems = [
  {
    section: 'MAIN',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    ],
  },
  {
    section: 'MANAGEMENT',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: Users },
      { label: 'Leads', href: '/admin/leads', icon: MessageSquare },
      { label: 'Cards', href: '/admin/cards', icon: CreditCard },
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { label: 'Contacts', href: '/admin/contacts', icon: MessageSquare },
      { label: 'Newsletters', href: '/admin/newsletters', icon: Mail },
    ],
  },
  {
    section: 'SETTINGS',
    items: [
      { label: 'Account', href: '/admin/account', icon: User },
      { label: 'Security', href: '/admin/security', icon: Lock },
    ],
  },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function AdminSidebar({ mobileOpen = false, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-30"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-[#0f172a] to-[#020617] border-r border-white/10 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static z-40 flex flex-col overflow-y-auto shadow-lg
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10 flex-shrink-0 bg-white/[0.02]">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <BrandLogo size="medium" variant="light" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          {menuItems.map((section) => (
            <div key={section.section}>
              <p className="px-3 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-widest">
                {section.section}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative
                        ${active
                          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30 shadow-[0_0_20px_rgba(74,222,128,0.15)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-green-400 to-emerald-500 rounded-r-full" />
                      )}
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-all duration-200 ${active ? 'text-green-400' : 'group-hover:scale-110 group-hover:text-green-400/60'}`} />
                      <span className="text-sm font-medium tracking-tight flex-1">{item.label}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-white/10 bg-white/[0.02]">
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} Tapvyo. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}
