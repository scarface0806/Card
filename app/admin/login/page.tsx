'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import AdminLoginForm from '@/components/admin/AdminLoginForm';

export default function AdminLoginPage() {
  const router = useRouter();

  // Redirect guard - validate active admin session.
  useEffect(() => {
    const validateAdminSession = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (data?.user?.role === 'ADMIN') {
          router.push('/admin/dashboard');
        }
      } catch {
        // No-op: stay on login page.
      }
    };

    validateAdminSession();
  }, [router]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070d1d] px-4 py-6 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-1/4 h-72 w-72 rounded-full bg-teal-500/12 blur-[110px]" />
        <div className="absolute -right-10 bottom-1/4 h-80 w-80 rounded-full bg-emerald-500/8 blur-[120px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#0f172d]/75 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="hidden lg:flex flex-col justify-between border-r border-white/10 bg-gradient-to-b from-[#101b35] via-[#0d162d] to-[#0a1227] p-10">
          <div>
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-500 shadow-lg shadow-teal-500/30">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-white">Tapvyo Admin</p>
                <p className="text-[11px] uppercase tracking-[0.24em] text-gray-400">Control Center</p>
              </div>
            </div>

            <div className="mt-12 space-y-4">
              <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white">
                Secure workspace for managing your NFC business.
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-gray-300">
                Access orders, cards, leads, and customer profiles from one clean dashboard built for your admin team.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Tapvyo NFC. All rights reserved.</p>
        </section>

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div className="w-full max-w-md">
            <div className="mb-7 text-center lg:text-left">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 shadow-lg shadow-teal-500/30 lg:hidden">
                <Zap className="h-7 w-7 text-white" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h2>
              <p className="mt-1 text-sm text-gray-400">Sign in with your admin credentials to continue.</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#151f37]/70 p-5 sm:p-6">
              <AdminLoginForm />
            </div>

            <p className="mt-6 text-center text-xs text-gray-500 lg:hidden">
              © {new Date().getFullYear()} Tapvyo NFC. All rights reserved.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
