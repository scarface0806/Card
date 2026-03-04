'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  SparklesIcon,
  CreditCardIcon,
  EnvelopeIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

const items = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: HomeIcon },
  { label: 'Customers', href: '/admin/customers', icon: UsersIcon },
  { label: 'Products', href: '/admin/products', icon: SparklesIcon },
  { label: 'Orders', href: '/admin/orders', icon: ClipboardDocumentListIcon },
  { label: 'Cards', href: '/admin/cards', icon: CreditCardIcon },
  { label: 'Newsletter', href: '/admin/newsletter', icon: EnvelopeIcon },
  { label: 'Profile', href: '/admin/profile', icon: CogIcon },
];

interface AdminSidebarProps {
  onNavigate?: () => void;
}

export default function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col space-y-1 p-4">
      {items.map(({ label, href, icon: Icon }) => {
        const active = pathname?.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => onNavigate && onNavigate()}
            className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors
              ${active ? 'bg-gray-200 font-semibold' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
