'use client';

import React from 'react';
import { Menu as MenuIcon, LogOut } from 'lucide-react';

interface Props {
  adminName?: string;
  avatarUrl?: string;
  onMenuClick?: () => void;
}

export default function AdminTopbar({ adminName = 'Admin', avatarUrl, onMenuClick }: Props) {
  return (
    <div className="flex items-center justify-between bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center space-x-2">
        {/* hamburger for mobile */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="text-gray-700 hover:text-gray-900 md:hidden"
          >
            <MenuIcon className="h-6 w-6" />
          </button>
        )}
        <h1 className="text-xl font-semibold text-gray-900 capitalize">
          Dashboard
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700 hidden sm:inline-block">
          {adminName}
        </span>
        {avatarUrl ? (
          <img src={avatarUrl} alt="avatar" className="h-8 w-8 rounded-full" />
        ) : (
          <div className="h-8 w-8 rounded-full bg-gray-300" />
        )}
        <button className="text-gray-500 hover:text-gray-700">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
