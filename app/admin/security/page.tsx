'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function SecurityPage() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [passwordStrength, setPasswordStrength] = useState({
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    isLongEnough: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'newPassword') {
      setPasswordStrength({
        hasUpper: /[A-Z]/.test(value),
        hasLower: /[a-z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        isLongEnough: value.length >= 8,
      });
    }
  };

  const toggleShowPassword = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!Object.values(passwordStrength).every(Boolean)) {
      setError('Password does not meet all requirements');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/admin/security/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to update password');
      }

      setSuccess(payload.message || 'Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordStrength({
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
        isLongEnough: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Security Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account security, password, and authentication preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Password Change Form */}
        <div className="lg:col-span-2 bg-[#1f2436] rounded-2xl border border-white/10 p-4 sm:p-6 lg:p-8 shadow-xl">
          <h2 className="text-lg font-medium text-white mb-8 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
            Change Password
          </h2>

          {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
          {success && <p className="text-sm text-emerald-400 mb-4">{success}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300">
                Current Password
              </label>
              <div className="relative group">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  disabled={submitting}
                  className="w-full px-4 py-2.5 bg-[#262b40] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword('current')}
                    disabled={submitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-400 transition-colors"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300">
                  New Password
                </label>
                <div className="relative group">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 bg-[#262b40] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('new')}
                    disabled={submitting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-400 transition-colors"
                  >
                    {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300">
                  Confirm Password
                </label>
                <div className="relative group">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat new password"
                    disabled={submitting}
                    className="w-full px-4 py-2.5 bg-[#262b40] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => toggleShowPassword('confirm')}
                    disabled={submitting}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-orange-400 transition-colors"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
              <button
                type="button"
                className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-95"
              >
                {submitting ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Requirements */}
        <div className="bg-[#1f2436] rounded-2xl border border-white/10 p-4 sm:p-6 lg:p-8 shadow-xl">
          <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
            Requirements
          </h2>

          <div className="space-y-4">
            <RequirementItem met={passwordStrength.hasUpper} label="One uppercase letter" />
            <RequirementItem met={passwordStrength.hasLower} label="One lowercase letter" />
            <RequirementItem met={passwordStrength.hasNumber} label="One numeric digit" />
            <RequirementItem met={passwordStrength.hasSpecial} label="One special character" />
            <RequirementItem met={passwordStrength.isLongEnough} label="At least 8 characters" />

            {/* Strength Meter */}
            <div className="mt-8 pt-8 border-t border-white/5 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Password Strength</span>
                <span
                  className={`font-semibold ${strengthScore <= 2 ? 'text-red-400' : strengthScore <= 4 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                >
                  {strengthScore <= 2 ? 'Weak' : strengthScore <= 4 ? 'Moderate' : 'Strong'}
                </span>
              </div>
              <div className="flex gap-2 h-1.5">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div
                    key={idx}
                    className={`flex-1 rounded-full bg-white/5 overflow-hidden`}
                  >
                    <div
                      className={`h-full transition-all duration-500 ${idx <= strengthScore
                          ? strengthScore <= 2
                            ? 'bg-red-500'
                            : strengthScore <= 4
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          : 'bg-transparent'
                        }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-3 text-sm transition-colors duration-300 ${met ? 'text-emerald-400' : 'text-gray-500'}`}>
      <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border ${met ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
        <CheckCircle className={`w-3 h-3 ${met ? 'opacity-100' : 'opacity-20'}`} />
      </div>
      {label}
    </div>
  );
}
