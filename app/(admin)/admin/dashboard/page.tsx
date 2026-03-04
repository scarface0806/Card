"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AdminContainer from "@/components/AdminContainer";
import AdminCard from "@/components/AdminCard";
import AdminTable from "@/components/AdminTable";

interface Stats {
  totalCustomers: number;
  totalOrders: number;
  totalCards: number;
  totalProducts: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch stats");
        }
        const data = await response.json();
        setStats(data.stats);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <AdminContainer>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          Error: {error}
        </div>
      </AdminContainer>
    );
  }

  return (
    <AdminContainer>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Total Customers', value: stats?.totalCustomers || 0, href: '/admin/customers' },
            { label: 'Total Orders', value: stats?.totalOrders || 0, href: '/admin/orders' },
            { label: 'Total Cards', value: stats?.totalCards || 0, href: '/admin/cards' },
            { label: 'Total Products', value: stats?.totalProducts || 0, href: '/admin/products' },
          ].map((item) => (
            <AdminCard
              key={item.label}
              title={item.label}
              actions={
                <Link
                  href={item.href}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  View all →
                </Link>
              }
              className="flex flex-col justify-between"
            >
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {item.value}
              </div>
            </AdminCard>
          ))}
        </div>

        {/* Info Box */}
        <AdminCard className="bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-700">
            📊 Real-time statistics from MongoDB. Click on any section to view details.
          </p>
        </AdminCard>
      </div>
    </AdminContainer>
  );
}
