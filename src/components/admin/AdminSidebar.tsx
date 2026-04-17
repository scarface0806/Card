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
        className={`fixed left-0 top-0 h-screen w-64 bg-[#0b1222] border-r border-white/10 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static z-40 flex flex-col overflow-y-auto shadow-[0_0_40px_rgba(0,0,0,0.35)]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex-shrink-0 bg-white/[0.02]">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <BrandLogo size="medium" variant="light" />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {menuItems.map((section) => (
            <div key={section.section}>
              <p className="px-3 mb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                        ${active
                          ? 'bg-gradient-to-r from-primary/25 to-secondary/15 text-primary border border-primary/30 shadow-[0_8px_20px_rgba(51,204,51,0.14)]'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                      )}
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${active ? 'text-primary' : 'group-hover:scale-110'}`} />
                      <span className="text-sm font-medium tracking-tight">{item.label}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-white/10 bg-white/[0.02]">
          <p className="text-[10px] text-gray-500 text-center">
            © {new Date().getFullYear()} Tapvyo. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}
