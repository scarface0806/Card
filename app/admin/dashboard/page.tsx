'use client';

import React, { useMemo } from 'react';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Users, UserCheck, UserX, ShoppingCart, ArrowUpRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { useDashboard, formatCurrency } from '@/hooks/useDashboard';

function mapOrderStatusToBadge(status: string): 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' {
  const normalized = status?.toUpperCase();
  if (normalized === 'PENDING' || normalized === 'PROCESSING' || normalized === 'SHIPPED') {
    return 'pending';
  }
  if (normalized === 'DELIVERED' || normalized === 'CONFIRMED') {
    return 'completed';
  }
  if (normalized === 'CANCELLED' || normalized === 'REFUNDED') {
    return 'cancelled';
  }
  return 'inactive';
}

export default function Dashboard() {
  const { metrics, loading, error, refetch } = useDashboard(false);

  const todayLabel = useMemo(
    () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    []
  );

  const recentOrders = useMemo(
    () =>
      (metrics?.recentOrders || []).map((order) => ({
        id: order.id,
        orderNum: order.orderNumber,
        customer: order.customer,
        date: new Date(order.createdAt).toLocaleDateString(),
        total: formatCurrency(order.total),
        status: mapOrderStatusToBadge(order.status),
      })),
    [metrics?.recentOrders]
  );

  const orderStatusRows = useMemo(
    () =>
      Object.entries(metrics?.orders.byStatus || {}).map(([status, count]) => ({
        status,
        count,
        health: mapOrderStatusToBadge(status),
      })),
    [metrics?.orders.byStatus]
  );

  const revenueRows = useMemo(
    () =>
      metrics
        ? [
            { label: 'Total Revenue', value: formatCurrency(metrics.revenue.total) },
            { label: 'This Month', value: formatCurrency(metrics.revenue.thisMonth) },
            { label: 'Completed Orders', value: metrics.orders.completed.toLocaleString() },
            { label: 'Cancelled Orders', value: metrics.orders.cancelled.toLocaleString() },
          ]
        : [],
    [metrics]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Loading live metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-red-400 mt-0.5">{error || 'Failed to load dashboard metrics'}</p>
        </div>
        <button
          onClick={refetch}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-400 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, Admin. Here&apos;s your business overview.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-600 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            {todayLabel}
          </span>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Total Customers"
          value={metrics.customers.total}
          icon={<Users className="w-5 h-5" />}
          description="NFC profile customers"
          color="blue"
        />
        <StatCard
          label="Active Customers"
          value={metrics.customers.active}
          icon={<UserCheck className="w-5 h-5" />}
          description="Live profile links"
          color="green"
        />
        <StatCard
          label="Disabled Customers"
          value={metrics.customers.disabled}
          icon={<UserX className="w-5 h-5" />}
          description="Profile access blocked"
          color="purple"
        />
        <StatCard
          label="Total Orders"
          value={metrics.orders.total}
          icon={<ShoppingCart className="w-5 h-5" />}
          description={`${metrics.orders.pending} pending`}
          color="orange"
        />
        <StatCard
          label="Total Leads"
          value={metrics.leads.total}
          icon={<MessageSquare className="w-5 h-5" />}
          description={`${metrics.leads.thisMonth} this month`}
          color="green"
        />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Order Status Summary */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Order Status Summary</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <DataTable
            columns={[
              { key: 'status', label: 'Status' },
              { key: 'count', label: 'Count' },
              {
                key: 'health',
                label: 'Health',
                render: (_value, row) => <StatusBadge status={row.health as any} />,
              },
            ]}
            data={orderStatusRows}
            actions={false}
            itemsPerPage={5}
          />
        </div>

        {/* Revenue Snapshot */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Revenue Snapshot</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <DataTable
            columns={[
              { key: 'label', label: 'Metric' },
              { key: 'value', label: 'Value' },
            ]}
            data={revenueRows}
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
      <p className="text-xs text-gray-600 text-center mt-10 pb-4">
        © {new Date().getFullYear()} Tapvyo Admin Panel · All rights reserved
      </p>
    </div>
  );
}
