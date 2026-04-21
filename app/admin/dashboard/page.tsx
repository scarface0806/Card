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
      <div className="space-y-8">
        <div className="admin-section-header">
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-description">Loading live metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="space-y-8">
        <div className="admin-section-header">
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-description text-red-400">{error || 'Failed to load dashboard metrics'}</p>
        </div>
        <button
          onClick={refetch}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="admin-section-header mb-0">
          <h1 className="admin-title">Dashboard</h1>
          <p className="admin-description">
            Welcome back, Admin. Here&apos;s your business overview.
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-gray-400">
          <span>{todayLabel}</span>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="admin-container">
        <StatCard
          label="Total Customers"
          value={metrics.customers.total}
          icon={<Users className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Active Customers"
          value={metrics.customers.active}
          icon={<UserCheck className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Disabled Customers"
          value={metrics.customers.disabled}
          icon={<UserX className="w-5 h-5" />}
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

      <section className="space-y-6">
        <div className="admin-section-header">
          <h2 className="admin-section-title">Revenue Analytics</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card card-padding">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total Orders</p>
            <p className="mt-4 text-2xl sm:text-3xl font-bold text-white">
              {metrics.orders.total.toLocaleString()}
            </p>
          </div>

          <div className="card card-padding">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Completed Orders</p>
            <p className="mt-4 text-2xl sm:text-3xl font-bold text-white">
              {metrics.orders.completed.toLocaleString()}
            </p>
          </div>

          <div className="card card-padding">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Pending Orders</p>
            <p className="mt-4 text-2xl sm:text-3xl font-bold text-white">
              {metrics.orders.pending.toLocaleString()}
            </p>
          </div>

          <div className="card card-padding">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Total Revenue</p>
            <p className="mt-4 text-2xl sm:text-3xl font-bold text-white">
              {formatInrCurrency.format(metrics.revenue.total)}
            </p>
          </div>

          <div className="card card-padding">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Today&apos;s Revenue</p>
            <p className="mt-4 text-2xl sm:text-3xl font-bold text-white">
              {todayRevenueLoaded ? formatInrCurrency.format(todayRevenue) : '...'}
            </p>
          </div>

          <div className="card card-padding">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Monthly Revenue</p>
            <p className="mt-4 text-2xl sm:text-3xl font-bold text-white">
              {formatInrCurrency.format(metrics.revenue.thisMonth)}
            </p>
          </div>
        </div>
      </section>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Summary */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="admin-section-title">Order Status</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors duration-200"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <DataTable
            columns={[
              { key: 'status', label: 'Status' },
              { key: 'count', label: 'Count' },
              {
                key: 'health',
                label: 'Status Badge',
                render: (_value, row) => <StatusBadge status={row.health as any} />,
              },
            ]}
            data={orderStatusRows}
            actions={false}
            itemsPerPage={5}
          />
        </div>

        {/* Revenue Snapshot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="admin-section-title">Revenue Snapshot</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors duration-200"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="admin-section-title">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1.5 text-xs text-green-400 hover:text-green-300 transition-colors duration-200"
          >
            View all <ArrowUpRight className="w-3.5 h-3.5" />
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
      <p className="text-xs text-gray-600 text-center mt-16 pt-8 border-t border-white/10">
        © {new Date().getFullYear()} Tapvyo Admin Panel · All rights reserved
      </p>
    </div>
  );
}
