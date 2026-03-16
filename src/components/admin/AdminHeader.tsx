'use client';

import React, { useState } from 'react';
import { Search, Bell, Maximize, User, LogOut, Settings, Menu, ChevronDown } from 'lucide-react';

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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className="h-16 bg-[#0c1428]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30 flex-shrink-0">
      <div className="h-full px-3 sm:px-4 md:px-6 flex items-center justify-between gap-3 md:gap-4">

        {/* Left: Mobile menu + Search */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative hidden sm:block w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-xl text-gray-300 placeholder-gray-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-0.5 sm:gap-1">

          {/* Mobile Search */}
          <button
            className="sm:hidden p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-gray-300 transition-colors"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-gray-300 transition-colors"
            title="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 hover:bg-white/5 rounded-xl text-gray-500 hover:text-gray-300 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full ring-2 ring-[#0d1117]" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-1.5 sm:mx-2" />

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 sm:gap-2.5 hover:bg-white/5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-colors group"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-orange-500/20">
                A
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-gray-300 leading-tight">Admin</p>
                <p className="text-[10px] text-gray-600 leading-tight">admin@tapvyo.com</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-[#161b2e] rounded-xl shadow-2xl border border-white/10 py-1.5 z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/5 mb-1">
                    <p className="text-sm font-semibold text-white">Admin User</p>
                    <p className="text-xs text-gray-500 mt-0.5">admin@tapvyo.com</p>
                  </div>
                  <a
                    href="/admin/account"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </a>
                  <a
                    href="/admin/security"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-gray-400 hover:text-white text-sm transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Security
                  </a>
                  <div className="border-t border-white/5 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-sm transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
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
