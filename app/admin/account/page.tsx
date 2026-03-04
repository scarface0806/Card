'use client';

import React, { useState } from 'react';
import { User, Upload } from 'lucide-react';

export default function AccountPage() {
  const [formData, setFormData] = useState({
    name: 'Admin User',
    email: 'admin@tapvyo.com',
    photo: null as File | null,
  });

  const [previewUrl, setPreviewUrl] = useState(
    'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff'
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile settings saved successfully!');
  };

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Account Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Update your profile information and account details</p>
      </div>

      <div className="max-w-2xl bg-[#1f2436] rounded-2xl border border-white/5 p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Profile Photo
            </label>
            <div className="flex items-center gap-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-orange-500/50 transition-colors">
                  <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-[#2a3048] hover:bg-[#313755] border border-white/5 text-white rounded-xl cursor-pointer transition-all text-sm font-medium">
                    <Upload className="w-4 h-4 text-orange-400" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </label>
                  <button type="button" className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">
                    Remove
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-3 font-normal">Recommended: Square image, max 5MB (JPG, PNG)</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                className="w-full px-4 py-2.5 bg-[#262b40] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
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
                className="w-full px-4 py-2.5 bg-[#262b40] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all"
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
              className="px-8 py-2.5 bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
