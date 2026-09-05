'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, BellOff, User, LogOut, Settings, Menu, ChevronDown, Loader2 } from 'lucide-react';

import { SUPPORT_EMAIL } from '@/lib/site-config';
import { isAbortError } from '@/lib/fetch-utils';
import useNewOrderNotifications from '@/hooks/useNewOrderNotifications';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

/** Debounce for the header search. Long enough that typing does not fire a
 *  request per keystroke, short enough to still feel live. */
const SEARCH_DEBOUNCE_MS = 250;

/** Results shown in the dropdown. The full list lives on /admin/orders. */
const SEARCH_RESULT_LIMIT = 8;

interface SearchResult {
  id: string;
  orderNumber: string | null;
  customerName: string;
  cardType: string;
  status: string;
}

/** The subset of /api/admin/orders' row shape this dropdown reads. */
interface ApiOrder {
  id: string;
  orderNumber?: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  cardType?: string | null;
  status?: string | null;
  user?: { name?: string | null } | null;
  items?: Array<{ productName?: string | null }> | null;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  // --- Search -------------------------------------------------------------
  // Queries the admin orders endpoint's existing `?search=` parameter, which
  // already matches orderNumber, guestName and guestEmail. No new API.
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { permission, requestPermission, unseenCount, acknowledge } =
    useNewOrderNotifications();

  // The ⌘K hint next to the field used to be decoration with a TODO on it.
  // This is the listener it was advertising.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/admin/orders?limit=${SEARCH_RESULT_LIMIT}&search=${encodeURIComponent(term)}`,
          { credentials: 'include', signal: controller.signal }
        );
        if (!response.ok) throw new Error('Search failed');

        const payload = await response.json();
        if (controller.signal.aborted) return;

        setResults(
          (payload.orders ?? []).map((order: ApiOrder) => ({
            id: String(order.id),
            orderNumber: order.orderNumber ?? null,
            customerName:
              order.guestName || order.user?.name || order.guestEmail || 'Guest',
            cardType: order.cardType || order.items?.[0]?.productName || '—',
            status: order.status || '—',
          }))
        );
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return;
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const goToOrders = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
    router.push('/admin/orders');
  }, [router]);

  /**
   * Bell click. First press asks for desktop-notification permission, because
   * browsers require a user gesture for that prompt. Later presses just clear
   * the badge and take the admin to the orders list.
   */
  const handleBellClick = useCallback(async () => {
    if (permission === 'default') {
      await requestPermission();
      return;
    }
    acknowledge();
    router.push('/admin/orders');
  }, [permission, requestPermission, acknowledge, router]);

  const bellTitle =
    permission === 'granted'
      ? unseenCount > 0
        ? `${unseenCount} new order${unseenCount === 1 ? '' : 's'}`
        : 'Desktop notifications on'
      : permission === 'denied'
        ? 'Desktop notifications blocked in browser settings'
        : permission === 'unsupported'
          ? 'This browser does not support desktop notifications'
          : 'Turn on desktop notifications for new orders';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // No-op
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
  };

  return (
    // h-16 + border-b matches the sidebar's logo band exactly, so the two
    // dividers read as a single horizontal line across the whole shell.
    <header className="tv-adm-header sticky top-0 z-30 h-16 flex-shrink-0">
      {/* Same gutter as the page content, so the search field and profile menu
          align with the cards and tables below instead of running wider. */}
      <div className="admin-gutter flex h-full items-center gap-3">

        {/* Left: mobile menu only */}
        <button
          onClick={onMenuClick}
          className="tv-adm-iconbtn lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Center: search. Searches orders by number, customer name or email -
            the three fields /api/admin/orders already indexes behind
            `?search=`. Results drop down in place rather than navigating, so
            the admin can look an order up without leaving the page they are on. */}
        <div className="flex flex-1 justify-center">
          <div className="relative hidden w-full max-w-sm sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tv-text-muted)]" />
            <input
              ref={searchInputRef}
              type="search"
              role="combobox"
              aria-expanded={searchOpen && query.trim().length >= 2}
              aria-controls="admin-search-results"
              aria-label="Search orders by number, customer name or email"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search orders..."
              className="tv-adm-input !py-2 !pl-9 !pr-14"
            />
            {searching ? (
              <Loader2
                aria-hidden="true"
                className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[var(--tv-text-muted)]"
              />
            ) : (
              <kbd
                aria-hidden="true"
                className="tv-adm-count pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 !rounded !px-1.5 !py-0.5"
              >
                ⌘K
              </kbd>
            )}

            {searchOpen && query.trim().length >= 2 ? (
              <>
                {/* Click-away, matching the profile menu's pattern below. */}
                <div className="fixed inset-0 z-30" onClick={() => setSearchOpen(false)} />
                <div
                  id="admin-search-results"
                  role="listbox"
                  className="tv-adm-dialog absolute left-0 right-0 z-40 mt-2 max-h-80 overflow-y-auto py-2"
                >
                  {results.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-[var(--tv-text-muted)]">
                      {searching ? 'Searching…' : `No orders match “${query.trim()}”`}
                    </p>
                  ) : (
                    results.map((result) => (
                      <button
                        key={result.id}
                        role="option"
                        aria-selected={false}
                        onClick={goToOrders}
                        className="flex w-full flex-col items-start gap-0.5 px-4 py-2.5 text-left transition-colors hover:bg-[rgba(241,243,241,0.05)]"
                      >
                        <span className="text-sm font-semibold text-[var(--tv-text)]">
                          {result.customerName}
                        </span>
                        <span className="text-[11px] text-[var(--tv-text-muted)]">
                          {result.orderNumber ?? '—'} · {result.cardType} · {result.status}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">

          {/* Mobile Search - the field itself is hidden below sm, so this
              reveals it by focusing the same input. */}
          <button
            className="tv-adm-iconbtn sm:hidden"
            title="Search orders"
            aria-label="Search orders"
            onClick={() => searchInputRef.current?.focus()}
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notifications. The dot used to be painted on unconditionally, so
              it claimed there was something unread even on an empty dashboard.
              It now tracks real unseen orders, and the bell doubles as the
              permission prompt - browsers only allow that from a click. */}
          <button
            className="tv-adm-iconbtn relative"
            title={bellTitle}
            aria-label={bellTitle}
            onClick={() => void handleBellClick()}
          >
            {permission === 'denied' || permission === 'unsupported' ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {/* Red, not green: an unread indicator is an alert, not a success. */}
            {unseenCount > 0 ? (
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--tv-danger)] ring-2 ring-[var(--tv-graphite)]" />
            ) : null}
          </button>

          {/* Divider */}
          <div className="mx-2 h-6 w-px bg-[var(--tv-rule)]" />

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="tv-adm-iconbtn !px-2 flex items-center gap-2.5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--tv-patina)] text-sm font-bold text-[var(--tv-ink)]">
                A
              </div>
              {/* Name + role only. The email lives in the dropdown below. */}
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold leading-tight text-[var(--tv-text)]">Admin</p>
                <p className="text-[11px] leading-tight text-[var(--tv-text-muted)]">Administrator</p>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="tv-adm-dialog absolute right-0 z-40 mt-2 w-56 py-2">
                  <div className="mb-1 border-b border-[var(--tv-rule)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--tv-text)]">Admin User</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--tv-text-muted)]">{SUPPORT_EMAIL}</p>
                  </div>
                  <a
                    href="/admin/account"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--tv-text-muted)] transition-colors hover:bg-[rgba(241,243,241,0.05)] hover:text-[var(--tv-patina)]"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </a>
                  <a
                    href="/admin/security"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--tv-text-muted)] transition-colors hover:bg-[rgba(241,243,241,0.05)] hover:text-[var(--tv-patina)]"
                  >
                    <Settings className="h-4 w-4" />
                    Security
                  </a>
                  <div className="mt-1 border-t border-[var(--tv-rule)] pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--tv-danger)] transition-colors hover:bg-[rgba(224,122,110,0.12)]"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
