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
    <main className="min-h-screen flex items-center justify-center bg-[#0d1117] p-6 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 group">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all duration-300 mb-4 scale-110">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tapvyo Admin</h1>
          <p className="text-gray-500 text-sm mt-1 uppercase tracking-widest font-medium">Secure Access</p>
        </div>

        {/* Login Card */}
        <div className="bg-[#161b2e]/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/5 p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-400 text-sm">
              Please enter your admin credentials to proceed.
            </p>
          </div>

          {/* Login Form */}
          <AdminLoginForm />
        </div>

        {/* Additional Links */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600 font-medium">
            © {new Date().getFullYear()} Tapvyo NFC · Business Solution
          </p>
        </div>
      </div>
    </main>
  );
}
