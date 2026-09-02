'use client';

/**
 * RESET PASSWORD
 *
 * Same card shell as /login, /signup and /forgot-password.
 *
 * WHY THE SUSPENSE BOUNDARY: the token arrives as `?token=...`, which means
 * useSearchParams(). On a prerendered route Next bails out of server rendering
 * for any component reading search params, and without a boundary that bailout
 * takes the whole page with it - shipping HTML that is nothing but a spinner.
 * The form is therefore its own component behind <Suspense>, so only the form
 * waits and the card shell still renders on the server. /create-card carries
 * the same note for the same reason.
 */

import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader, CheckCircle2 } from 'lucide-react';

import { ROUTES } from '@/utils/constants';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    defaultValues: { password: '', confirmPassword: '' },
  });

  const password = watch('password');

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true);
    setServerError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });

      const payload = await response.json();

      if (response.ok) {
        setDone(true);
        // Long enough to read the confirmation, then on to login. No session
        // is issued by the reset endpoint, so signing in is the next step.
        window.setTimeout(() => router.push(ROUTES.LOGIN), 2500);
      } else {
        setServerError(
          payload.message || payload.error || 'Something went wrong. Please try again.'
        );
      }
    } catch {
      setServerError('An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // A visit with no token at all is a broken or truncated link. Say so before
  // asking for a password that could not be submitted anywhere.
  if (!token) {
    return (
      <>
        <div className="text-center mb-6">
          <h1 className="tv-h3 mb-2">Link incomplete</h1>
        </div>
        <p className="tv-small text-center mb-8">
          This password reset link is missing its token. Email clients sometimes
          break long links across lines - please open the link from the email
          again, or request a new one.
        </p>
        <Link href="/forgot-password" className="tv-btn tv-btn-primary w-full">
          Request a new link
        </Link>
      </>
    );
  }

  if (done) {
    return (
      <>
        <div className="text-center mb-6">
          <CheckCircle2
            className="w-10 h-10 mx-auto mb-4 text-[#4CAE89]"
            aria-hidden="true"
          />
          <h1 className="tv-h3 mb-2">Password updated</h1>
        </div>
        <p className="tv-small text-center mb-8" role="status">
          Your password has been reset. Taking you to the login page...
        </p>
        <Link href={ROUTES.LOGIN} className="tv-btn tv-btn-primary w-full">
          Go to login
        </Link>
      </>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="tv-h3 mb-2">Choose a new password</h1>
        <p className="tv-small">
          At least 8 characters, with an uppercase letter, a lowercase letter and
          a number.
        </p>
      </div>

      {serverError && (
        <div className="mb-6" role="alert">
          <p className="tv-form-error">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="password" className="tv-label">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A961] pointer-events-none" />
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
                validate: (value) => {
                  if (!/[A-Z]/.test(value)) return 'Include at least one uppercase letter';
                  if (!/[a-z]/.test(value)) return 'Include at least one lowercase letter';
                  if (!/[0-9]/.test(value)) return 'Include at least one number';
                  return true;
                },
              })}
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              className={`tv-input !pl-10 !pr-11 ${errors.password ? '!border-[#FF8A80]' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="tv-focus absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#A9B5B0] hover:text-[#F1F3F1] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {errors.password && (
            <p className="tv-form-error mt-2">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="tv-label">
            Confirm New Password
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
              autoComplete="new-password"
              placeholder="••••••••"
              className={`tv-input !pl-10 !pr-11 ${errors.confirmPassword ? '!border-[#FF8A80]' : ''}`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
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

        <button
          type="submit"
          disabled={isLoading}
          className="tv-btn tv-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Updating password...
            </>
          ) : (
            'Reset password'
          )}
        </button>
      </form>

      <p className="tv-small text-center mt-8">
        <Link href={ROUTES.LOGIN} className="tv-btn-tertiary !min-h-0 !text-sm">
          Back to login
        </Link>
      </p>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="tv-hero min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="tv-modal-panel !bg-[#151C1A] p-8 md:p-10">
          <Suspense
            fallback={
              <div className="text-center py-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#4CAE89] border-t-transparent mx-auto mb-4" />
                <p className="tv-mono">Loading</p>
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
