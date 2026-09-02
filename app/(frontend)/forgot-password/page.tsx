'use client';

/**
 * FORGOT PASSWORD
 *
 * Same card shell as /login and /signup: tv-hero ground, tv-modal-panel on
 * #151C1A, tv-input / tv-label / tv-btn-primary. Nothing new visually.
 *
 * The success state deliberately does NOT say whether an account was found -
 * it repeats whatever generic message the API returned. See the note at the
 * top of app/api/auth/forgot-password/route.ts.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Mail, Loader, CheckCircle2 } from 'lucide-react';

import { ROUTES } from '@/utils/constants';
import { SUPPORT_EMAIL } from '@/lib/site-config';

interface ForgotPasswordFormData {
  email: string;
}

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [sentMessage, setSentMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setServerError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const payload = await response.json();

      if (response.ok) {
        setSentMessage(
          payload.message ||
            'If an account exists for that email, we have sent a password reset link.'
        );
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

  return (
    <main className="tv-hero min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="tv-modal-panel !bg-[#151C1A] p-8 md:p-10">
          {sentMessage ? (
            <>
              <div className="text-center mb-6">
                <CheckCircle2
                  className="w-10 h-10 mx-auto mb-4 text-[#4CAE89]"
                  aria-hidden="true"
                />
                <h1 className="tv-h3 mb-2">Check your inbox</h1>
              </div>

              <p className="tv-small text-center mb-8">{sentMessage}</p>

              <p className="tv-small text-center">
                The link expires in 30 minutes and can be used once. Still nothing
                after a few minutes? Write to{' '}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="tv-btn-tertiary !min-h-0 !text-sm"
                >
                  {SUPPORT_EMAIL}
                </a>
                .
              </p>

              <p className="tv-small text-center mt-8">
                <Link href={ROUTES.LOGIN} className="tv-btn-tertiary !min-h-0 !text-sm">
                  Back to login
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="tv-h3 mb-2">Reset your password</h1>
                <p className="tv-small">
                  Enter the email address on your account and we will send you a
                  reset link.
                </p>
              </div>

              {serverError && (
                <div className="mb-6" role="alert">
                  <p className="tv-form-error">{serverError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={`tv-input !pl-10 ${errors.email ? '!border-[#FF8A80]' : ''}`}
                    />
                  </div>
                  {errors.email && (
                    <p className="tv-form-error mt-2">{errors.email.message}</p>
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
                      Sending link...
                    </>
                  ) : (
                    'Send reset link'
                  )}
                </button>
              </form>

              <p className="tv-small text-center mt-8">
                Remembered it?{' '}
                <Link href={ROUTES.LOGIN} className="tv-btn-tertiary !min-h-0 !text-sm">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
