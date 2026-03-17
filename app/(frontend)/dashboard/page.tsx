'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Home, Settings, User, Menu, X } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }

    // Try to get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // If user data is not available, use mock data
        setUser({
          id: 'mock-admin-id',
          email: localStorage.getItem('userEmail') || 'admin@local.dev',
          name: 'Admin User',
          role: 'ADMIN',
        });
      }
    } else {
      // Fallback to mock user data
      setUser({
        id: 'mock-admin-id',
        email: 'admin@local.dev',
        name: 'Admin User',
        role: 'ADMIN',
      });
    }
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userEmail');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="font-bold text-lg text-gray-900">Tapvyo</span>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="/" className="flex items-center gap-2 text-gray-700 hover:text-teal-600 transition">
                <Home className="w-5 h-5" />
                Home
              </a>
              <a href="/products" className="flex items-center gap-2 text-gray-700 hover:text-teal-600 transition">
                <span>Products</span>
              </a>
              <a href="/order" className="flex items-center gap-2 text-gray-700 hover:text-teal-600 transition">
                <span>Orders</span>
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="md:hidden pb-4 space-y-2">
              <a href="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Home
              </a>
              <a href="/products" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Products
              </a>
              <a href="/order" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Orders
              </a>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                Logout
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name || 'User'}!
              </h1>
              <p className="text-gray-600 mt-1">{user?.email}</p>
              {user?.role && <p className="text-sm text-teal-600 font-medium mt-1">Role: {user.role}</p>}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-teal-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
              </div>
              <div className="text-teal-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 6H6.28l-.31-1.243A1 1 0 005 4H3z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-medium">Products</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">View</p>
              </div>
              <div className="text-blue-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a1 1 0 000 2h6a1 1 0 000-2H7zM4 5a2 2 0 012-2 1 1 0 000-2H3a1 1 0 000 2h1v9a2 2 0 002 2h8a2 2 0 002-2V5h1a1 1 0 000-2h-3a1 1 0 000 2h2v9H6V5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-600 text-sm font-medium">Account</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">Active</p>
              </div>
              <div className="text-purple-500">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/create-card"
              className="p-4 border-2 border-teal-200 rounded-xl hover:bg-teal-50 transition flex items-center justify-between group"
            >
              <div>
                <p className="font-semibold text-gray-900">Create Your NFC Card</p>
                <p className="text-sm text-gray-600 mt-1">Design and customize your NFC card</p>
              </div>
              <span className="text-teal-600 group-hover:translate-x-1 transition">→</span>
            </a>

            <a
              href="/products"
              className="p-4 border-2 border-blue-200 rounded-xl hover:bg-blue-50 transition flex items-center justify-between group"
            >
              <div>
                <p className="font-semibold text-gray-900">Browse Products</p>
                <p className="text-sm text-gray-600 mt-1">Explore our NFC card designs</p>
              </div>
              <span className="text-blue-600 group-hover:translate-x-1 transition">→</span>
            </a>

            <a
              href="/order"
              className="p-4 border-2 border-purple-200 rounded-xl hover:bg-purple-50 transition flex items-center justify-between group"
            >
              <div>
                <p className="font-semibold text-gray-900">View Orders</p>
                <p className="text-sm text-gray-600 mt-1">Check your order history</p>
              </div>
              <span className="text-purple-600 group-hover:translate-x-1 transition">→</span>
            </a>

            {/* Admin Panel */}
            {user?.role === 'ADMIN' && (
              <a
                href="/admin/dashboard"
                className="p-4 border-2 border-orange-200 rounded-xl hover:bg-orange-50 transition flex items-center justify-between group"
              >
                <div>
                  <p className="font-semibold text-gray-900">Admin Panel</p>
                  <p className="text-sm text-gray-600 mt-1">Manage your business</p>
                </div>
                <span className="text-orange-600 group-hover:translate-x-1 transition">→</span>
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-12 py-6 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 text-sm">
            © 2024 Tapvyo NFC. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
