'use client';

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import { registerUser } from '@/services/auth';
import { ROUTES } from '@/utils/constants';
import GoogleAuthButton from '@/components/GoogleAuthButton';
import { safeRedirect, withRedirect } from '@/lib/safe-redirect';

interface SignupFormData {
  fullName: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Google returns through /api/auth/google-complete, which honours ?next=.
  // Default to "/" so behaviour is unchanged when nobody was gated.
  const googleCallbackUrl = safeRedirect(searchParams.get('redirect'), '/');
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
      mobile: '',
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
        mobile: data.mobile,
        password: data.password,
        confirmPassword: data.confirmPassword,
      });

      if (response.success && response.data?.token) {
        // Store auth token
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // If they were gated out of somewhere (checkout, most often), go
        // back there. Otherwise keep the previous behaviour: a guest checkout
        // under the same email is backfilled onto the new account by the
        // register route, so send them straight to their orders when there is
        // already something there to look at.
        const fallback = response.attachedOrders ? '/my-orders' : '/';
        const destination = safeRedirect(searchParams.get('redirect'), fallback);

        setTimeout(() => {
          router.push(destination);
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

            {/* Mobile Field. Required: the account exists so we can reach the
                customer about their order, mostly on WhatsApp, and an account
                with no number cannot do that. Validation mirrors the checkout
                form's mobile rule exactly - see indianMobileSchema in
                src/lib/validators.ts - so signup and checkout agree on what a
                valid number is. */}
            <div>
              <label htmlFor="mobile" className="tv-label">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none" />
                <input
                  {...register('mobile', {
                    required: 'Mobile number is required',
                    validate: (value) => {
                      // Strip +91 / 91 / 0 and separators the same way the
                      // server does before judging the length.
                      const digits = value.replace(/\D+/g, '');
                      const local = digits.startsWith('91')
                        ? digits.slice(2)
                        : digits.startsWith('0')
                          ? digits.slice(1)
                          : digits;

                      if (local.length !== 10) {
                        return 'Enter a valid 10-digit mobile number';
                      }
                      if (!/^[6-9]/.test(local)) {
                        return 'Mobile number must start with 6, 7, 8 or 9';
                      }
                      if (/^([0-9])\1{9}$/.test(local)) {
                        return 'Enter a valid mobile number';
                      }
                      return true;
                    },
                  })}
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="9876543210"
                  className={`tv-input !pl-10 ${errors.mobile ? '!border-[#FF8A80]' : ''}`}
                />
              </div>
              {errors.mobile && (
                <p className="tv-form-error mt-2">{errors.mobile.message}</p>
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
                    // 8, not 6. registerSchema on the server enforces min(8),
                    // so a 6-character password used to pass client validation
                    // and then come back as a raw zod message.
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
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
            <GoogleAuthButton text="Continue with Google" callbackUrl={googleCallbackUrl} />
          </form>

          {/* Login Link */}
          <p className="tv-small text-center mt-8">
            Already have an account?{' '}
            <Link
              href={withRedirect(ROUTES.LOGIN, searchParams.get('redirect'))}
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

/**
 * useSearchParams() forces a client-side-rendering bailout, which fails
 * `next build` on a prerendered route unless it sits inside a Suspense
 * boundary. The shell below is static so the page still paints instantly.
 */
function SignupFallback() {
  return (
    <main className="tv-hero min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="tv-modal-panel !bg-[#151C1A] p-8 md:p-10">
          <div className="text-center mb-8">
            <h1 className="tv-h3 mb-2">Create Your Account</h1>
            <p className="tv-small">Join Tapvyo and start with your NFC business card</p>
          </div>
          <div className="flex justify-center py-6" role="status" aria-label="Loading">
            <Loader className="h-6 w-6 animate-spin" aria-hidden="true" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupForm />
    </Suspense>
  );
}
