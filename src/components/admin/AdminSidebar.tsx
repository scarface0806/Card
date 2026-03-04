'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Zap,
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
        className={`fixed left-0 top-0 h-screen w-64 bg-[#0d1117] border-r border-white/5 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static z-40 flex flex-col overflow-y-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/5 flex-shrink-0">
          <Link href="/admin/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all duration-200">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">Tapvyo</span>
              <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">Admin</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {menuItems.map((section) => (
            <div key={section.section}>
              <p className="px-3 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
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
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative
                        ${active
                          ? 'bg-gradient-to-r from-orange-500/20 to-orange-400/10 text-orange-400 border border-orange-500/20'
                          : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                        }`}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orange-400 rounded-r-full" />
                      )}
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${active ? 'text-orange-400' : 'group-hover:scale-110'}`} />
                      <span className="text-sm font-medium">{item.label}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-70" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 py-4 border-t border-white/5">
          <p className="text-[10px] text-gray-600 text-center">
            © {new Date().getFullYear()} Tapvyo. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}
