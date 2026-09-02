'use client';

import React, { useState } from 'react';
import { Search, Bell, User, LogOut, Settings, Menu, ChevronDown } from 'lucide-react';

import { SUPPORT_EMAIL } from '@/lib/site-config';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);

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

        {/* Center: search */}
        <div className="flex flex-1 justify-center">
          <div className="relative hidden w-full max-w-sm sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--tv-text-muted)]" />
            <input
              type="text"
              placeholder="Search..."
              className="tv-adm-input !py-2 !pl-9 !pr-14"
            />
            {/* Static visual hint only — no keyboard shortcut listener is wired up. */}
            {/* TODO(ui): needs handler — implement the ⌘K shortcut this hint advertises. */}
            <kbd
              aria-hidden="true"
              className="tv-adm-count pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 !rounded !px-1.5 !py-0.5"
            >
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">

          {/* Mobile Search */}
          <button
            className="tv-adm-iconbtn sm:hidden"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notifications */}
          <button
            className="tv-adm-iconbtn relative"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {/* Red, not green: an unread indicator is an alert, not a success. */}
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[var(--tv-danger)] ring-2 ring-[var(--tv-graphite)]" />
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
