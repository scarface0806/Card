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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Store token mirror in localStorage for client-only guards.
        localStorage.setItem('authToken', result.token);
        localStorage.setItem('admin_token', result.token);

        // Redirect to dashboard
        router.push(redirectTo);
      } else {
        setServerError(result.error || result.message || 'Invalid email or password.');
      }
    } catch (error) {
      setServerError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Server Error */}
      {serverError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400 font-medium">{serverError}</p>
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-300"
        >
          Email Address
        </label>
        <div className="relative group">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 group-focus-within:text-orange-400 transition-colors pointer-events-none" />
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
            className={`w-full pl-11 pr-4 py-3 bg-[#262b40] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200 ${errors.email
                ? 'border-red-500'
                : 'border-white/10'
              } disabled:opacity-50`}
          />
        </div>
        {errors.email && (
          <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-300"
        >
          Password
        </label>
        <div className="relative group">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500 group-focus-within:text-orange-400 transition-colors pointer-events-none" />
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
            className={`w-full pl-11 pr-12 py-3 bg-[#262b40] border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all duration-200 ${errors.password
                ? 'border-red-500'
                : 'border-white/10'
              } disabled:opacity-50`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={isLoading}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-400 transition-colors disabled:opacity-50"
          >
            {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1.5 text-xs text-red-400 font-medium">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between py-1">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-[#262b40] text-orange-500 focus:ring-orange-500/50" />
          <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Remember me</span>
        </label>
        <button type="button" className="text-sm text-orange-400 hover:text-orange-300 transition-colors font-medium">Forgot password?</button>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold py-3.5 px-4 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
