'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Upload } from 'lucide-react';

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: '',
    photo: null as File | null,
  });

  const [previewUrl, setPreviewUrl] = useState(
    'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
  );

  const fallbackPreviewUrl = useMemo(() => {
    const safeName = encodeURIComponent(formData.name || 'Admin User');
    return `https://ui-avatars.com/api/?name=${safeName}&background=0D8ABC&color=fff`;
  }, [formData.name]);

  useEffect(() => {
    const loadAccount = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/admin/account', {
          credentials: 'include',
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.error || 'Failed to load account');
        }

        const user = payload.user;
        setFormData((prev) => ({
          ...prev,
          name: user.name || 'Admin User',
          email: user.email || '',
          avatar: user.avatar || '',
        }));
        const safeName = encodeURIComponent(user.name || 'Admin User');
        setPreviewUrl(
          user.avatar || `https://ui-avatars.com/api/?name=${safeName}&background=0D8ABC&color=fff`
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load account');
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'avatar') {
      setPreviewUrl(value || fallbackPreviewUrl);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPreviewUrl(dataUrl);
        setFormData((prev) => ({ ...prev, avatar: dataUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/account', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          avatar: formData.avatar,
        }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to save account settings');
      }

      setSuccess(payload.message || 'Profile settings saved successfully');
      if (payload.user?.avatar) {
        setPreviewUrl(payload.user.avatar);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Account Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Update your profile information and account details</p>
      </div>

      <div className="max-w-3xl bg-[#1f2436] rounded-2xl border border-white/10 p-4 sm:p-6 lg:p-8 shadow-xl">
        {loading && <p className="text-sm text-gray-400 mb-4">Loading account details...</p>}
        {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
        {success && <p className="text-sm text-emerald-400 mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Profile Photo
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-teal-500/50 transition-colors">
                  <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#2a3048] hover:bg-[#313755] border border-white/5 text-white rounded-xl cursor-pointer transition-all text-sm font-medium">
                    <Upload className="w-4 h-4 text-teal-400" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, avatar: '', photo: null }));
                      setPreviewUrl(fallbackPreviewUrl);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3 font-normal">Recommended: Square image, max 5MB (JPG, PNG)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading || saving}
                className="w-full px-4 py-2.5 bg-[#262b40] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading || saving}
                className="w-full px-4 py-2.5 bg-[#262b40] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-300">
                Avatar URL (Optional)
              </label>
              <input
                type="url"
                id="avatar"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                disabled={loading || saving}
                placeholder="https://example.com/avatar.png"
                className="w-full px-4 py-2.5 bg-[#262b40] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-all"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/5">
            <button
              type="button"
              className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || saving}
              className="px-8 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-500 text-white rounded-xl font-semibold shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all active:scale-95"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
