'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight } from 'lucide-react';
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
  const [mobile, setMobile] = useState('');
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
          mobile,
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
    } catch {
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
            className="tv-modal-backdrop z-50"
          />

          {/* Modal - scale from 0.96, no bounce */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-modal-title"
              className="tv-modal-panel max-w-md pointer-events-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="tv-modal-close z-10"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Header */}
              <div className="tv-modal-head pr-14">
                <h2 id="auth-modal-title" className="tv-h3 mb-1">
                  {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h2>
                <p className="tv-small">
                  {mode === 'login'
                    ? 'Sign in to your Tapvyo account'
                    : 'Join us and get your NFC digital business card'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="tv-modal-body">
                {error && (
                  <p className="tv-form-error mb-4" role="alert">
                    {error}
                  </p>
                )}

                {/* Name Field (Signup only) */}
                {mode === 'signup' && (
                  <div>
                    <label className="tv-label">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="tv-input"
                      required
                    />
                  </div>
                )}

                {/* Mobile Field (Signup only). Added because registration now
                    requires a mobile number - the account exists so we can
                    reach the customer about their order. Without this field
                    this modal's signup would be rejected by the API. */}
                {mode === 'signup' && (
                  <div>
                    <label className="tv-label">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      placeholder="9876543210"
                      className="tv-input"
                      required
                    />
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="tv-label">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="tv-input"
                    required
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="tv-label">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="tv-input"
                    required
                  />
                </div>

                {/* Primary Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="tv-btn tv-btn-primary w-full mt-6 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span>
                    {loading
                      ? 'Processing...'
                      : mode === 'login'
                        ? 'Login'
                        : 'Create Account'}
                  </span>
                  {!loading && <ArrowUpRight className="w-4 h-4" aria-hidden="true" />}
                </button>
              </form>

              <div className="px-[clamp(1.25rem,1rem+1vw,2rem)] pb-2">
              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#F1F3F1]/12" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="tv-mono px-3 bg-[#151C1A]">Or continue with</span>
                </div>
              </div>

              {/* Google Button */}
              <button
                onClick={handleGoogleAuth}
                type="button"
                className="tv-btn tv-btn-secondary w-full"
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
              </div>

              {/* Switch Mode Link */}
              <div className="tv-modal-foot text-center">
                <span className="tv-small">
                  {mode === 'login'
                    ? "Don't have an account? "
                    : 'Already have an account? '}
                </span>
                <button
                  onClick={() => onModeChange(mode === 'login' ? 'signup' : 'login')}
                  className="tv-btn-tertiary !min-h-0 !text-sm"
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


