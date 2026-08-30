'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import { loginUser } from '@/services/auth';
import { ROUTES } from '@/utils/constants';
import GoogleAuthButton from '@/components/GoogleAuthButton';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError('');

    try {
      const response = await loginUser({
        email: data.email,
        password: data.password,
      });

      if (response.success && response.data?.token) {
        // Store auth token
        localStorage.setItem('authToken', response.data.token);
        if (data.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        // Store user data if available
        if (response.data?.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('userEmail', response.data.user.email);
        } else {
          // Store email from login for mock auth
          localStorage.setItem('userEmail', data.email);
        }

        // Redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 500);
      } else {
        setServerError(response.message || 'Login failed. Please try again.');
      }
    } catch (error) {
      setServerError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="tv-hero min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="tv-modal-panel !bg-[#151C1A] p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="tv-h3 mb-2">Welcome Back</h1>
            <p className="tv-small">Login to manage your NFC profile</p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-6" role="alert">
              <p className="tv-form-error">{serverError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="tv-label">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none" />
                <input
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  })}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className={`tv-input !pl-10 ${errors.email ? '!border-[#FF8A80]' : ''}`}
                />
              </div>
              {errors.email && (
                <p className="tv-form-error mt-2">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="tv-label">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none" />
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`tv-input !pl-10 !pr-11 ${errors.password ? '!border-[#FF8A80]' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="tv-focus absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#A9B5B0] hover:text-[#F1F3F1] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="tv-form-error mt-2">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                  className="tv-focus w-4 h-4 rounded accent-[#4CAE89]"
                />
                <span className="tv-small">Remember me</span>
              </label>
              <Link
                href="/contact-us"
                className="tv-btn-tertiary !min-h-0 !text-sm"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="tv-btn tv-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#F1F3F1]/12"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="tv-mono px-4 bg-[#151C1A]">Or continue with</span>
              </div>
            </div>

            {/* Google Login Button */}
            <GoogleAuthButton text="Continue with Google" callbackUrl="/" />
          </form>

          {/* Signup Link */}
          <p className="tv-small text-center mt-8">
            Don't have an account?{' '}
            <Link
              href={ROUTES.SIGNUP}
              className="tv-btn-tertiary !min-h-0 !text-sm"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
