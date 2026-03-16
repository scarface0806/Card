'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const verifyAdmin = async () => {
      // Allow login page without auth check redirect loop.
      if (pathname === '/admin/login') {
        setAuthorized(true);
        setCheckingAuth(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Unauthorized');
        }

        const payload = await response.json();
        if (payload?.user?.role !== 'ADMIN') {
          throw new Error('Admin access required');
        }

        setAuthorized(true);
      } catch {
        setAuthorized(false);
        router.replace('/admin/login');
      } finally {
        setCheckingAuth(false);
      }
    };

    verifyAdmin();
  }, [pathname, router]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0b1020] text-white flex items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-gray-300">
          Checking admin session...
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  if (pathname === '/admin/login') {
    return (
      <div className="admin-shell min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="admin-shell flex h-screen overflow-hidden bg-[#0b1020] text-white">
      {/* Sidebar */}
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 flex-col overflow-hidden">
        {/* Header */}
        <AdminHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full px-3 py-4 sm:px-4 md:px-6 md:py-6 xl:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
