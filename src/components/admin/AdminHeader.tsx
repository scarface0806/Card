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
    <header className="h-16 bg-gradient-to-r from-[#0f172a]/80 to-[#020617]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30 flex-shrink-0 shadow-sm">
      <div className="h-full px-4 sm:px-6 md:px-8 flex items-center justify-between gap-4">

        {/* Left: Mobile menu + Search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-green-400 transition-colors duration-200"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative hidden sm:block w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-300 placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">

          {/* Mobile Search */}
          <button
            className="sm:hidden p-2.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-green-400 transition-colors duration-200"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-green-400 transition-colors duration-200"
            title="Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button
            className="relative p-2.5 hover:bg-white/10 rounded-lg text-gray-500 hover:text-green-400 transition-colors duration-200"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-green-400 rounded-full ring-2 ring-[#020617]" />
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-white/10 mx-2" />

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-black font-bold text-sm shadow-lg">
                A
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-semibold text-gray-300 leading-tight">Admin</p>
                <p className="text-[10px] text-gray-500 leading-tight">santhosh@tapvyo.com</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-gradient-to-b from-[#0f172a] to-[#020617] rounded-lg shadow-2xl border border-white/10 py-2 z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 mb-1">
                    <p className="text-sm font-semibold text-white">Admin User</p>
                    <p className="text-xs text-gray-500 mt-0.5">santhosh@tapvyo.com</p>
                  </div>
                  <a
                    href="/admin/account"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-gray-400 hover:text-green-400 text-sm transition-colors duration-200"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </a>
                  <a
                    href="/admin/security"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-gray-400 hover:text-green-400 text-sm transition-colors duration-200"
                  >
                    <Settings className="w-4 h-4" />
                    Security
                  </a>
                  <div className="border-t border-white/5 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-sm transition-colors duration-200"
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
