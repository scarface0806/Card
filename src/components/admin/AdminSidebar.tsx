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
          className="fixed inset-0 bg-black/50 lg:hidden z-30"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white transform transition-transform lg:translate-x-0 lg:static z-40 overflow-y-auto
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-800">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
              T
            </div>
            <span className="text-xl font-bold">Tapvyo</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-4 py-6 space-y-8">
          {menuItems.map((section) => (
            <div key={section.section}>
              <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                {section.section}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onMobileClose}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        active
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-950">
          <p className="text-xs text-gray-400 text-center">
            © 2024 Tapvyo. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}
