'use client';

import React, { useState } from 'react';
import { Search, Sun, Moon, Maximize, User, LogOut, Settings } from 'lucide-react';

interface AdminHeaderProps {
  onMenuClick?: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [profileOpen, setProfileOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-4 ml-6">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            title="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            title="Fullscreen"
          >
            <Maximize className="w-5 h-5" />
          </button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200"></div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                A
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">Admin</span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-40">
                <a
                  href="/admin/account"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <User className="w-4 h-4" />
                  Profile
                </a>
                <a
                  href="/admin/security"
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  <Settings className="w-4 h-4" />
                  Security
                </a>
                <button
                  onClick={() => {
                    localStorage.removeItem('authToken');
                    window.location.href = '/login';
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-red-600 border-t border-gray-200 mt-2 pt-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
