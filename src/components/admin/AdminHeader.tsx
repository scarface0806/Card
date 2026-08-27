'use client';

import React, { useState } from 'react';
import { Search, Bell, User, LogOut, Settings, Menu, ChevronDown } from 'lucide-react';

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
    <header className="sticky top-0 z-30 h-16 flex-shrink-0 border-b border-white/10 bg-gradient-to-r from-[#0f172a]/80 to-[#020617]/80 backdrop-blur-xl">
      {/* Same gutter as the page content, so the search field and profile menu
          align with the cards and tables below instead of running wider. */}
      <div className="admin-gutter flex h-full items-center gap-3">

        {/* Left: mobile menu only */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2.5 text-gray-400 transition-colors duration-200 hover:bg-white/10 hover:text-green-400 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Center: search */}
        <div className="flex flex-1 justify-center">
          <div className="relative hidden w-full max-w-sm sm:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-14 text-sm text-gray-200 placeholder-[#9ca3af] transition-all duration-200 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/20"
            />
            {/* Static visual hint only — no keyboard shortcut listener is wired up. */}
            {/* TODO(ui): needs handler — implement the ⌘K shortcut this hint advertises. */}
            <kbd
              aria-hidden="true"
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/[0.12] bg-white/[0.06] px-1.5 py-0.5 font-sans text-[11px] font-medium text-[#9ca3af]"
            >
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">

          {/* Mobile Search */}
          <button
            className="rounded-lg p-2.5 text-gray-400 transition-colors duration-200 hover:bg-white/10 hover:text-green-400 sm:hidden"
            title="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {/* Notifications */}
          <button
            className="relative rounded-lg p-2.5 text-gray-400 transition-colors duration-200 hover:bg-white/10 hover:text-green-400"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {/* Red, not green: an unread indicator is an alert, not a success. */}
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500 ring-2 ring-[#020617]" />
          </button>

          {/* Divider */}
          <div className="mx-2 h-6 w-px bg-white/10" />

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-white/5"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 text-sm font-bold text-black">
                A
              </div>
              {/* Name + role only. The email lives in the dropdown below. */}
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold leading-tight text-white">Admin</p>
                <p className="text-[11px] leading-tight text-[#9ca3af]">Administrator</p>
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-lg border border-white/[0.12] bg-gradient-to-b from-[#0f172a] to-[#020617] py-2 shadow-2xl">
                  <div className="mb-1 border-b border-white/10 px-4 py-3">
                    <p className="text-sm font-semibold text-white">Admin User</p>
                    <p className="mt-0.5 truncate text-xs text-[#9ca3af]">santhosh@tapvyo.com</p>
                  </div>
                  <a
                    href="/admin/account"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors duration-200 hover:bg-white/5 hover:text-green-400"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </a>
                  <a
                    href="/admin/security"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 transition-colors duration-200 hover:bg-white/5 hover:text-green-400"
                  >
                    <Settings className="h-4 w-4" />
                    Security
                  </a>
                  <div className="mt-1 border-t border-white/[0.08] pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-400 transition-colors duration-200 hover:bg-red-500/10 hover:text-red-300"
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
