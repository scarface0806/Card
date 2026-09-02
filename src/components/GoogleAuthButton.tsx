'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Loader } from 'lucide-react';

interface GoogleAuthButtonProps {
  text?: string;
  /** Where to land after a successful sign-in. Must be a relative path. */
  callbackUrl?: string;
}

export default function GoogleAuthButton({
  text = 'Continue with Google',
  callbackUrl = '/',
}: GoogleAuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      /**
       * PRE-FLIGHT CHECK, and the reason this button used to do nothing.
       *
       * When GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / NEXTAUTH_SECRET are
       * unset, the next-auth route returns 501 for every endpoint. next-auth's
       * signIn() calls getProviders() first, swallows that 501, gets null, and
       * quietly redirects to /api/auth/error - which is also 501 JSON. So the
       * click either appeared to do nothing or dumped raw JSON on the user,
       * and the catch below never fired because signIn() RESOLVES rather than
       * rejecting. Checking first turns a silent dead end into a real message.
       */
      const probe = await fetch('/api/auth/providers', { cache: 'no-store' });

      if (!probe.ok) {
        setError(
          'Google sign-in is not available right now. Please use your email and password.'
        );
        setIsLoading(false);
        return;
      }

      const providers = await probe.json();
      if (!providers?.google) {
        setError(
          'Google sign-in is not available right now. Please use your email and password.'
        );
        setIsLoading(false);
        return;
      }

      /**
       * Go through the bridge, not straight to `callbackUrl`.
       *
       * next-auth issues its own `next-auth.session-token`, which nothing else
       * in this app reads - proxy.ts and authenticate() look for `auth-token`.
       * /api/auth/google-complete converts the one into the other, creates the
       * Prisma user and backfills guest orders, then forwards to `next`.
       * Landing on `callbackUrl` directly would leave the user anonymous as far
       * as the rest of the site is concerned.
       */
      const bridge = `/api/auth/google-complete?next=${encodeURIComponent(callbackUrl)}`;

      await signIn('google', { callbackUrl: bridge });
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Could not start Google sign-in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => void handleGoogleSignIn()}
        disabled={isLoading}
        className="w-full bg-white border border-gray-200 rounded-xl py-3 flex items-center justify-center gap-3 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-300"
      >
        {isLoading ? (
          <Loader className="w-5 h-5 animate-spin text-gray-600" />
        ) : (
          <>
            {/* Google SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
            <span className="text-gray-700 font-medium">{text}</span>
          </>
        )}
      </button>

      {error && (
        <p className="tv-form-error mt-3" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
