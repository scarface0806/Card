'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

interface AdminLoginFormProps {
  redirectTo?: string;
}

export default function AdminLoginForm({ redirectTo = '/admin/dashboard' }: AdminLoginFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  // Two-step login: after a correct password, an admin with 2FA gets
  // { requires2fa: true } and an httpOnly pending cookie (never touched from
  // JS). This component then asks for the code and posts it to
  // /api/admin/login/2fa, which returns the same success body as the
  // password route - so the success path below is shared, unchanged.
  const [needsCode, setNeedsCode] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [code, setCode] = useState('');

  const finishLogin = (token: string) => {
    // Store token mirror in localStorage for client-only guards.
    localStorage.setItem('authToken', token);
    localStorage.setItem('admin_token', token);

    // Use full redirect so middleware sees fresh auth cookie immediately.
    window.location.assign(redirectTo);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setServerError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.requires2fa === true) {
        setNeedsCode(true);
        setCode('');
        setUseBackupCode(false);
      } else if (response.ok && result.success) {
        finishLogin(result.token);
      } else {
        setServerError(result.error || result.message || 'Invalid email or password.');
      }
    } catch {
      setServerError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setServerError('');

    try {
      const response = await fetch('/api/admin/login/2fa', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const result = await response.json().catch(() => ({}));

      if (response.ok && result.success) {
        finishLogin(result.token);
        return;
      }
      // One message for every failure, as the API gives; the 429 keeps its own.
      setServerError(response.status === 429 ? (result.message || 'Too many login attempts. Please try again later.') : 'Invalid code');
      setCode('');
    } catch {
      setServerError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2 - the code. Rendered in place of the password form.
  if (needsCode) {
    const inputClass =
      'w-full px-4 py-3 bg-[var(--tv-slate)] border border-[rgba(241,243,241,0.18)] rounded-xl text-[var(--tv-text)] placeholder-[rgba(169,181,176,0.7)] focus:outline-none focus:border-[rgba(76,174,137,0.60)] focus:ring-2 focus:ring-[rgba(76,174,137,0.50)] transition-all duration-200 font-mono tracking-[0.3em] disabled:opacity-50';
    const codeReady = useBackupCode ? code.replace(/[\s-]/g, '').length === 8 : code.length === 6;

    return (
      <form onSubmit={onSubmitCode} className="space-y-5">
        {serverError && (
          <div role="alert" className="rounded-xl border border-[rgba(224,122,110,0.30)] bg-[rgba(224,122,110,0.10)] p-3">
            <p className="text-sm text-[var(--tv-danger)] font-medium">{serverError}</p>
          </div>
        )}

        <div className="space-y-2.5">
          <label htmlFor="twofa-code" className="tv-adm-field-label">
            {useBackupCode ? 'Backup code' : 'Authentication code'}
          </label>
          <p className="text-sm text-[var(--tv-text-muted)]">
            {useBackupCode
              ? 'Enter one of the 8-character backup codes you saved. Each works once.'
              : 'Enter the 6-digit code from your authenticator app.'}
          </p>
          {useBackupCode ? (
            <input
              id="twofa-code"
              autoComplete="one-time-code"
              autoCapitalize="characters"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 12))}
              placeholder="XXXXXXXX"
              disabled={isLoading}
              className={inputClass}
              autoFocus
              required
            />
          ) : (
            <input
              id="twofa-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              disabled={isLoading}
              className={inputClass}
              autoFocus
              required
            />
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !codeReady}
          className="tv-btn tv-btn-gilded w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:filter-none"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify'
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setUseBackupCode((prev) => !prev);
            setCode('');
            setServerError('');
          }}
          disabled={isLoading}
          className="min-h-[44px] w-full text-sm text-[var(--tv-patina)] hover:underline transition-colors font-medium disabled:opacity-50"
        >
          {useBackupCode ? 'Use your authenticator app instead' : 'Use a backup code instead'}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Server Error */}
      {serverError && (
        <div className="rounded-xl border border-[rgba(224,122,110,0.30)] bg-[rgba(224,122,110,0.10)] p-3">
          <p className="text-sm text-[var(--tv-danger)] font-medium">{serverError}</p>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2.5">
        <label
          htmlFor="email"
          className="tv-adm-field-label"
        >
          Email Address
        </label>
        <div className="relative group">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--tv-text-muted)] group-focus-within:text-[var(--tv-patina)] transition-colors pointer-events-none" />
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Please enter a valid email address',
              },
            })}
            id="email"
            type="email"
            placeholder="admin@example.com"
            disabled={isLoading}
            className={`w-full pl-11 pr-4 py-3 bg-[var(--tv-slate)] border rounded-xl text-[var(--tv-text)] placeholder-[rgba(169,181,176,0.7)] focus:outline-none focus:border-[rgba(76,174,137,0.60)] focus:ring-2 focus:ring-[rgba(76,174,137,0.50)] transition-all duration-200 ${errors.email
                ? 'border-[rgba(224,122,110,0.32)]'
              : 'border-[rgba(241,243,241,0.18)]'
              } disabled:opacity-50`}
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-xs text-[var(--tv-danger)] font-medium">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2.5">
        <label
          htmlFor="password"
          className="tv-adm-field-label"
        >
          Password
        </label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--tv-text-muted)] group-focus-within:text-[var(--tv-patina)] transition-colors pointer-events-none" />
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
            disabled={isLoading}
            className={`w-full pl-11 pr-12 py-3 bg-[var(--tv-slate)] border rounded-xl text-[var(--tv-text)] placeholder-[rgba(169,181,176,0.7)] focus:outline-none focus:border-[rgba(76,174,137,0.60)] focus:ring-2 focus:ring-[rgba(76,174,137,0.50)] transition-all duration-200 ${errors.password
                ? 'border-[rgba(224,122,110,0.32)]'
              : 'border-[rgba(241,243,241,0.18)]'
              } disabled:opacity-50`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--tv-text-muted)] hover:text-[var(--tv-patina)] transition-colors disabled:opacity-50"
          >
            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-xs text-[var(--tv-danger)] font-medium">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between py-0.5">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="w-4 h-4 rounded border-[var(--tv-rule)] bg-[var(--tv-slate)] text-[var(--tv-patina)] focus:ring-[rgba(76,174,137,0.35)]" />
          <span className="text-sm text-[var(--tv-text-muted)] group-hover:text-[var(--tv-text)] transition-colors">Remember me</span>
        </label>
        <button type="button" className="text-sm text-[var(--tv-patina)] hover:text-[var(--tv-patina)] transition-colors font-medium">Forgot password?</button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="tv-btn tv-btn-gilded w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:filter-none"
      >
        {isLoading ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in to Dashboard'
        )}
      </button>
    </form>
  );
}
