'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { isAbortError } from '@/lib/fetch-utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const authVerifiedRef = useRef(false);

  const verifyAdmin = useCallback(async (signal?: AbortSignal) => {
    if (pathname === '/admin/login') {
      setAuthorized(true);
      setCheckingAuth(false);
      return;
    }

    // Skip re-verification if already confirmed this session
    if (authVerifiedRef.current) {
      setAuthorized(true);
      setCheckingAuth(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        signal,
      });

      if (!response.ok) {
        throw new Error('Unauthorized');
      }

      const payload = await response.json();
      if (signal?.aborted) return;

      if (payload?.user?.role !== 'ADMIN') {
        throw new Error('Admin access required');
      }

      authVerifiedRef.current = true;
      setAuthorized(true);
    } catch (error) {
      // An aborted check means the layout unmounted or the route changed.
      // Treating it as "unauthorized" would bounce the admin to /admin/login.
      if (signal?.aborted || isAbortError(error)) return;

      authVerifiedRef.current = false;
      setAuthorized(false);
      router.replace('/admin/login');
    } finally {
      if (!signal?.aborted) setCheckingAuth(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    const controller = new AbortController();
    verifyAdmin(controller.signal);

    return () => controller.abort();
  }, [verifyAdmin]);

  if (checkingAuth) {
    return (
      <div className="tv-adm-shell tv-adm-ground min-h-screen flex items-center justify-center">
        <div className="tv-adm-panel px-4 py-3 text-sm text-[var(--tv-text-muted)]">
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
      <div className="tv-adm-shell tv-adm-ground min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div className="tv-adm-shell flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content */}
      {/* One scroll container for the header AND the content, so both share the
          same content box and their .admin-gutter edges line up exactly at every
          width. scrollbar-gutter:stable reserves the scrollbar space up front so
          the gutter does not shift when content grows past one screen. */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto [scrollbar-gutter:stable]">
        {/* Header */}
        <AdminHeader onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)} />

        {/* Main Area - Proper spacing with 8px grid */}
        <main className="tv-adm-ground flex-1">
          <div className="admin-gutter py-5 md:py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
