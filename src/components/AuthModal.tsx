'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { loginUser, registerUser, setAuthToken } from '@/services/auth';
import { useRouter } from 'next/navigation';

type AuthMode = 'login' | 'signup';

interface AuthModalProps {
  isOpen: boolean;
  mode: AuthMode;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
}

export default function AuthModal({ isOpen, mode, onClose, onModeChange }: AuthModalProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (mode === 'login') {
        result = await loginUser({ email, password });
      } else {
        result = await registerUser({
          fullName: name,
          email,
          password,
          confirmPassword: password // Simple case for now
        });
      }

      if (result.success && result.data) {
        setAuthToken(result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        onClose();

        // Redirect based on role if possible, or just dashboard
        router.push('/dashboard');
        router.refresh();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    // Handle Google auth implementation
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - fast fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'linear' }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50"
          />

          {/* Modal - scale from 0.96, no bounce */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div className="w-full max-w-md rounded-3xl shadow-2xl p-6 md:p-8 bg-white relative max-h-[90vh] overflow-y-auto">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#0f2e25] font-space-grotesk mb-2">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {mode === 'login'
                    ? 'Sign in to your Tapvyo account'
                    : 'Join us and get your NFC digital business card'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {/* Name Field (Signup only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-sm font-medium text-[#0f2e25] mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
                      required
                    />
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-[#0f2e25] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-sm font-medium text-[#0f2e25] mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 border border-teal-200 rounded-xl focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 transition-all"
                    required
                  />
                </div>

                {/* Primary Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-green-600 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                >
                  <span>
                    {loading
                      ? 'Processing...'
                      : mode === 'login'
                        ? 'Login'
                        : 'Create Account'}
                  </span>
                  {!loading && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              {/* Google Button */}
              <button
                onClick={handleGoogleAuth}
                type="button"
                className="w-full flex items-center justify-center gap-3 px-6 py-3 border border-gray-300 bg-white text-gray-700 font-medium rounded-full hover:bg-gray-50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>Google</span>
              </button>

              {/* Switch Mode Link */}
              <div className="mt-6 text-center text-sm">
                <span className="text-gray-600">
                  {mode === 'login'
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                </span>
                <button
                  onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
                  className="text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                >
                  {mode === 'login' ? 'Sign Up' : 'Login'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )
      }
    </AnimatePresence >
  );
}


