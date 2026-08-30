'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import { registerUser } from '@/services/auth';
import { ROUTES } from '@/utils/constants';
import GoogleAuthButton from '@/components/GoogleAuthButton';

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false,
    },
  });

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    if (!data.agreeToTerms) {
      setServerError('Please agree to the Terms & Conditions');
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      const response = await registerUser({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (response.success && response.data?.token) {
        // Store auth token
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Simulate redirect to dashboard or onboarding
        setTimeout(() => {
          router.push('/');
        }, 500);
      } else {
        setServerError(response.message || 'Signup failed. Please try again.');
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
            <h1 className="tv-h3 mb-2">Create Your Account</h1>
            <p className="tv-small">Join Tapvyo and start with your NFC business card</p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-6" role="alert">
              <p className="tv-form-error">{serverError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name Field */}
            <div>
              <label htmlFor="fullName" className="tv-label">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none" />
                <input
                  {...register('fullName', {
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  })}
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  className={`tv-input !pl-10 ${errors.fullName ? '!border-[#FF8A80]' : ''}`}
                />
              </div>
              {errors.fullName && (
                <p className="tv-form-error mt-2">{errors.fullName.message}</p>
              )}
            </div>

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

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="tv-label">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none" />
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === password || 'Passwords do not match',
                  })}
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`tv-input !pl-10 !pr-11 ${errors.confirmPassword ? '!border-[#FF8A80]' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="tv-focus absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#A9B5B0] hover:text-[#F1F3F1] transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="tv-form-error mt-2">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-primary/10 rounded-xl">
              <input
                {...register('agreeToTerms', {
                  required: 'You must agree to the Terms & Conditions',
                })}
                id="agreeToTerms"
                type="checkbox"
                className="tv-focus w-4 h-4 mt-1 rounded accent-[#4CAE89] cursor-pointer"
              />
              <label htmlFor="agreeToTerms" className="tv-small cursor-pointer flex-1">
                I agree to the{' '}
                <Link href={ROUTES.TERMS} className="tv-btn-tertiary !min-h-0 !text-sm">
                  Terms & Conditions
                </Link>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="tv-form-error -mt-2">{errors.agreeToTerms.message}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="tv-btn tv-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
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

            {/* Google Signup Button */}
            <GoogleAuthButton text="Continue with Google" callbackUrl="/" />
          </form>

          {/* Login Link */}
          <p className="tv-small text-center mt-8">
            Already have an account?{' '}
            <Link
              href={ROUTES.LOGIN}
              className="tv-btn-tertiary !min-h-0 !text-sm"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

