'use client';

import React, { useState } from 'react';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Users, CreditCard, ShoppingCart, Mail, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

// Mock data for tables
const recentCustomers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1 234 567 8900', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1 234 567 8901', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+1 234 567 8902', status: 'inactive' },
];

const recentCards = [
  { id: 1, name: 'Premium Card', description: 'Gold plated card', status: 'active' },
  { id: 2, name: 'Silver Card', description: 'Silver design', status: 'active' },
  { id: 3, name: 'Bronze Card', description: 'Bronze finish', status: 'inactive' },
];

const recentOrders = [
  { id: 1, orderNum: 'ORD-001', customer: 'John Doe', date: '2024-03-01', total: '₹299', status: 'completed' },
  { id: 2, orderNum: 'ORD-002', customer: 'Jane Smith', date: '2024-03-02', total: '₹149', status: 'pending' },
  { id: 3, orderNum: 'ORD-003', customer: 'Bob Johnson', date: '2024-03-03', total: '₹399', status: 'cancelled' },
];

export default function Dashboard() {
  const [stats] = useState({
    totalCustomers: 1234,
    totalCards: 456,
    totalOrders: 789,
    totalSubscriptions: 345,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, Admin. Here&apos;s your business overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-600 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={stats.totalCustomers}
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatCard
          label="Total Cards"
          value={stats.totalCards}
          icon={<CreditCard className="w-5 h-5" />}
          trend={{ value: 8, isPositive: true }}
          color="purple"
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          icon={<ShoppingCart className="w-5 h-5" />}
          trend={{ value: 5, isPositive: false }}
          color="orange"
        />
        <StatCard
          label="Subscriptions"
          value={stats.totalSubscriptions}
          icon={<Mail className="w-5 h-5" />}
          trend={{ value: 15, isPositive: true }}
          color="green"
        />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Recent Customers */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Recent Customers</h2>
            <Link
              href="/admin/customers"
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <DataTable
            columns={[
              { key: 'name', label: 'Name' },
              { key: 'email', label: 'Email' },
              {
                key: 'status',
                label: 'Status',
                render: (status) => (
                  <StatusBadge status={status as any} />
                ),
              },
            ]}
            data={recentCustomers}
            actions={false}
            itemsPerPage={5}
          />
        </div>

        {/* Recent Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Recent Cards</h2>
            <Link
              href="/admin/cards"
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <DataTable
            columns={[
              { key: 'name', label: 'Card Name' },
              { key: 'description', label: 'Description' },
              {
                key: 'status',
                label: 'Status',
                render: (status) => (
                  <StatusBadge status={status as any} />
                ),
              },
            ]}
            data={recentCards}
            actions={false}
            itemsPerPage={5}
          />
        </div>
      </div>

      {/* Recent Orders — Full Width */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
          >
            View all <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        <DataTable
          columns={[
            { key: 'orderNum', label: 'Order ID', width: '120px' },
            { key: 'customer', label: 'Customer' },
            { key: 'date', label: 'Date', width: '120px' },
            { key: 'total', label: 'Total', width: '80px' },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <StatusBadge status={status as any} />
              ),
            },
          ]}
          data={recentOrders}
          actions={false}
          itemsPerPage={10}
        />
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-700 text-center mt-10 pb-4">
        © {new Date().getFullYear()} Tapvyo Admin Panel · All rights reserved
      </p>
    </div>
  );
}
