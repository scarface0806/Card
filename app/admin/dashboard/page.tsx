'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
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

const formatInrCurrency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

export default function Dashboard() {
  const { metrics, loading, error, refetch } = useDashboard(false);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [todayRevenueLoaded, setTodayRevenueLoaded] = useState(false);

  const fetchTodayRevenue = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard', { credentials: 'include' });
      if (!response.ok) return;
      const payload = await response.json();
      setTodayRevenue(Number(payload?.todayRevenue || 0));
    } catch {
      // Silently fail — todayRevenue is supplemental
    } finally {
      setTodayRevenueLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchTodayRevenue();
  }, [fetchTodayRevenue]);

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
          className="px-4 py-2 rounded-lg bg-teal-600 text-white hover:bg-teal-500 transition-colors"
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
          color="teal"
        />
        <StatCard
          label="Total Leads"
          value={metrics.leads.total}
          icon={<MessageSquare className="w-5 h-5" />}
          description={`${metrics.leads.thisMonth} this month`}
          color="green"
        />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Revenue Analytics</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 rounded-xl p-5 shadow-lg border border-slate-700">
            <p className="text-sm text-slate-400">Total Orders</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {metrics.orders.total.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 shadow-lg border border-slate-700">
            <p className="text-sm text-slate-400">Completed Orders</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {metrics.orders.completed.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 shadow-lg border border-slate-700">
            <p className="text-sm text-slate-400">Pending Orders</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {metrics.orders.pending.toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 shadow-lg border border-slate-700">
            <p className="text-sm text-slate-400">Total Revenue</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatInrCurrency.format(metrics.revenue.total)}
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 shadow-lg border border-slate-700">
            <p className="text-sm text-slate-400">Today&apos;s Revenue</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {todayRevenueLoaded ? formatInrCurrency.format(todayRevenue) : '...'}
            </p>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 shadow-lg border border-slate-700">
            <p className="text-sm text-slate-400">Monthly Revenue</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {formatInrCurrency.format(metrics.revenue.thisMonth)}
            </p>
          </div>
        </div>
      </section>

      {/* Tables Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Order Status Summary */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Order Status Summary</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
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
              className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
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
            className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300 transition-colors"
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
