'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function SecurityPage() {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    if (!Object.values(passwordStrength).every(Boolean)) {
      alert('Password does not meet all requirements!');
      return;
    }

    alert('Password changed successfully!');
    setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const strengthScore = Object.values(passwordStrength).filter(Boolean).length;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account security and password</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Password Change Form */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  id="currentPassword"
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword('current')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword('new')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => toggleShowPassword('confirm')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 rounded-lg text-white font-medium hover:bg-blue-700"
              >
                Update Password
              </button>
            </div>
          </form>
        </div>

        {/* Password Requirements */}
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Password Requirements</h2>

          <div className="space-y-3">
            <div className={`flex items-center gap-3 text-sm ${passwordStrength.hasUpper ? 'text-green-600' : 'text-gray-600'}`}>
              <CheckCircle className={`w-4 h-4 ${passwordStrength.hasUpper ? 'fill-current' : ''}`} />
              Uppercase letter (A-Z)
            </div>
            <div className={`flex items-center gap-3 text-sm ${passwordStrength.hasLower ? 'text-green-600' : 'text-gray-600'}`}>
              <CheckCircle className={`w-4 h-4 ${passwordStrength.hasLower ? 'fill-current' : ''}`} />
              Lowercase letter (a-z)
            </div>
            <div className={`flex items-center gap-3 text-sm ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-600'}`}>
              <CheckCircle className={`w-4 h-4 ${passwordStrength.hasNumber ? 'fill-current' : ''}`} />
              Number (0-9)
            </div>
            <div className={`flex items-center gap-3 text-sm ${passwordStrength.hasSpecial ? 'text-green-600' : 'text-gray-600'}`}>
              <CheckCircle className={`w-4 h-4 ${passwordStrength.hasSpecial ? 'fill-current' : ''}`} />
              Special character (!@#$%^&*)
            </div>
            <div className={`flex items-center gap-3 text-sm ${passwordStrength.isLongEnough ? 'text-green-600' : 'text-gray-600'}`}>
              <CheckCircle className={`w-4 h-4 ${passwordStrength.isLongEnough ? 'fill-current' : ''}`} />
              At least 8 characters
            </div>

            {/* Strength Meter */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-2">Strength: <span
                className={`${
                  strengthScore <= 2 ? 'text-red-600' : strengthScore <= 3 ? 'text-yellow-600' : 'text-green-600'
                }`}
              >
                {strengthScore <= 2 ? 'Weak' : strengthScore <= 3 ? 'Medium' : 'Strong'}
              </span></p>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    strengthScore <= 2 ? 'bg-red-500 w-1/3' : strengthScore <= 3 ? 'bg-yellow-500 w-2/3' : 'bg-green-500 w-full'
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
