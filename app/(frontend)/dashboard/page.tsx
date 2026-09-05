'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Menu, X, User, ArrowUpRight } from 'lucide-react';
import BrandLogo from '@/components/common/BrandLogo';
import { ROUTES } from '@/utils/constants';
import { SITE_NAME } from '@/lib/site-config';

interface UserData {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

const NAV_LINKS = [
  { label: 'Home', href: ROUTES.HOME },
  { label: 'Cards', href: ROUTES.CARDS },
  { label: 'Products', href: ROUTES.PRODUCTS },
];

export default function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    setLastOrderId(localStorage.getItem('lastOrderId'));

    // Try to get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // If user data is not available, use mock data
        setUser({
          id: 'mock-admin-id',
          email: localStorage.getItem('userEmail') || 'admin@local.dev',
          name: 'Admin User',
          role: 'ADMIN',
        });
      }
    } else {
      // Fallback to mock user data
      setUser({
        id: 'mock-admin-id',
        email: 'admin@local.dev',
        name: 'Admin User',
        role: 'ADMIN',
      });
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="tv-hero min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4CAE89] border-t-transparent mx-auto mb-4" />
          <p className="tv-mono">Loading dashboard</p>
        </div>
      </div>
    );
  }

  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  // /order is a redirect to the checkout, so linking "your order" at it sent
  // people to a fresh order form. Point at the confirmation for the order we
  // actually know about, and at support when there isn't one.
  const orderHref = lastOrderId
    ? `${ROUTES.ORDER_SUCCESS}?orderId=${lastOrderId}`
    : ROUTES.CONTACT;

  const quickActions = [
    {
      href: ROUTES.CREATE_CARD,
      title: 'Create your NFC card',
      description: 'Design and order a card in five steps.',
    },
    {
      href: ROUTES.CARDS,
      title: 'Browse designs',
      description: 'See every template and finish we print.',
    },
    {
      href: orderHref,
      title: lastOrderId ? 'Your latest order' : 'Ask about an order',
      description: lastOrderId
        ? `Order ${lastOrderId}`
        : 'We will look it up from your email address.',
    },
    ...(user?.role === 'ADMIN'
      ? [
          {
            href: '/admin/dashboard',
            title: 'Admin panel',
            description: 'Orders, customers and products.',
          },
        ]
      : []),
  ];

  return (
    <div className="tv-hero min-h-screen">
      {/* Signed-in header. Same materials as the marketing nav, fewer moves. */}
      <header className="tv-appbar">
        <div className="site-container">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link href={ROUTES.HOME} className="tv-focus flex min-h-[44px] items-center">
              <BrandLogo size="small" />
            </Link>

            <nav aria-label="Dashboard" className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="tv-navlink tv-focus"
                  aria-current={pathname === link.href ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={handleLogout}
                className="tv-btn tv-btn-secondary !min-h-[40px] ml-3"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Log out
              </button>
            </nav>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="tv-nav-toggle tv-focus inline-flex md:hidden"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="dashboard-menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" aria-hidden="true" />
              )}
            </button>
          </div>

          {mobileMenuOpen && (
            <nav id="dashboard-menu" aria-label="Dashboard" className="md:hidden pb-6">
              <ul>
                {NAV_LINKS.map((link, index) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="tv-nav-mobile-link tv-focus"
                      aria-current={pathname === link.href ? 'page' : undefined}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="tv-nav-mobile-num" aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleLogout}
                className="tv-btn tv-btn-secondary w-full mt-5"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                Log out
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="site-container tv-section-tight">
        {/* Welcome */}
        <div className="flex flex-wrap items-center gap-5 mb-10">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[rgba(201,169,97,0.42)] bg-[rgba(201,169,97,0.12)] text-[#C9A961] font-semibold text-xl"
            aria-hidden="true"
          >
            {initial || <User className="w-6 h-6" />}
          </div>
          <div className="min-w-0">
            <span className="tv-eyebrow">Your account</span>
            <h1 className="tv-h3 mt-2">Welcome back, {user?.name || 'there'}</h1>
            <p className="tv-small mt-1 break-words">{user?.email}</p>
          </div>
          {user?.role && (
            <span className="tv-tag tv-tag-brass ml-auto">{user.role}</span>
          )}
        </div>

        <hr className="tv-rule" />

        {/* Account facts. A spec sheet, not three tiles in three different
            accent colours. */}
        <section aria-labelledby="account-heading" className="mt-10">
          <h2 id="account-heading" className="tv-mono mb-3">
            At a glance
          </h2>
          <div className="tv-summary max-w-xl">
            <div className="tv-summary-row">
              <span className="tv-summary-key">Orders placed</span>
              <span className="tv-summary-val">{lastOrderId ? '1' : '0'}</span>
            </div>
            <div className="tv-summary-row">
              <span className="tv-summary-key">Digital profile</span>
              <span className="tv-summary-val tv-summary-val-patina">Active</span>
            </div>
            <div className="tv-summary-row">
              <span className="tv-summary-key">Hosting</span>
              <span className="tv-summary-val tv-summary-val-patina">Free, forever</span>
            </div>
          </div>
        </section>

        {/* Quick actions */}
        <section aria-labelledby="actions-heading" className="mt-12">
          <h2 id="actions-heading" className="tv-mono mb-4">
            Quick actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.title}
                href={action.href}
                className="tv-panel tv-panel-pad tv-focus group flex items-start justify-between gap-4"
              >
                <span className="min-w-0">
                  <span className="tv-h4 block">{action.title}</span>
                  <span className="tv-small mt-1 block break-words">
                    {action.description}
                  </span>
                </span>
                <ArrowUpRight
                  className="w-5 h-5 shrink-0 text-[#4CAE89] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="tv-surface-graphite border-t border-[#F1F3F1]/10 mt-16">
        <div className="site-container py-6">
          <p className="tv-small text-center">
            &copy; {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
