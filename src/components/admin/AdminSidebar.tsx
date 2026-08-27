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
  Target,
  Contact,
  User,
  Lock,
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
      { label: 'Leads', href: '/admin/leads', icon: Target },
      { label: 'Cards', href: '/admin/cards', icon: CreditCard },
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
      { label: 'Contacts', href: '/admin/contacts', icon: Contact },
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
        className={`fixed left-0 top-0 h-screen w-[220px] bg-gradient-to-b from-[#0f172a] to-[#020617] border-r border-white/10 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static z-40 flex flex-col overflow-y-auto shadow-lg
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo — h-16 matches the header height exactly so this divider and the
            header's bottom border form one continuous horizontal line. */}
        <div className="flex h-16 flex-shrink-0 items-center border-b border-white/10 bg-white/[0.02] px-5">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <BrandLogo size="small" variant="light" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
          {menuItems.map((section) => (
            <div key={section.section}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9ca3af]">
                {section.section}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      /* Active state uses exactly two signals: a tinted
                         background and green foreground. No accent bar, no
                         border, no glow, no chevron (there is no submenu). */
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors duration-200
                        ${active
                          ? 'bg-green-500/10 text-green-400'
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm font-medium tracking-tight">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer — build stamp (mirrors "version" in package.json) */}
        <div className="flex-shrink-0 border-t border-white/10 bg-white/[0.02] px-3 py-3">
          <p className="text-[11px] tabular-nums text-[#9ca3af]">v0.1.0</p>
        </div>
      </aside>
    </>
  );
}
