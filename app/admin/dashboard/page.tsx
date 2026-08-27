'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import StatCard from '@/components/admin/StatCard';
import CustomerMetricsCard from '@/components/admin/CustomerMetricsCard';
import PendingOrdersReviewBanner from '@/components/admin/PendingOrdersReviewBanner';
import {
  ShoppingCart,
  Target,
  IndianRupee,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useDashboard, formatCurrency } from '@/hooks/useDashboard';

/** Shared section heading / link / grid styles, so every group on the page sits
 *  in the same hierarchy: h1 28px -> section 16px -> card label 11px. */
const SECTION_TITLE = 'text-base font-semibold tracking-tight text-white';
const STAT_GRID = 'grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-3';
/** Applied to the 3rd card of a 3-card row so it fills the width of the 2-column
 *  range instead of leaving an empty slot beside it. 3 columns only from xl,
 *  where the 220px sidebar still leaves each card wide enough for a full
 *  INR currency value at 28px. */
const STAT_SPAN_LAST = 'min-w-0 sm:col-span-2 xl:col-span-1';

/** Reusable skeletons so the layout is reserved before data lands. */
function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-[136px] animate-pulse rounded-xl border border-white/[0.12] bg-gradient-to-b from-[#0f172a] to-[#020617] ${className}`}
    />
  );
}

function TableSkeleton() {
  return (
    <div className="min-w-0 space-y-3">
      <div className="h-5 w-40 animate-pulse rounded bg-white/[0.08]" />
      <div className="h-64 animate-pulse rounded-xl border border-white/[0.12] bg-gradient-to-b from-[#0f172a] to-[#020617]" />
    </div>
  );
}

/**
 * Below-the-fold tables are code-split: DataTable and its pagination tree stay
 * out of this route's initial JavaScript, so the stat cards paint first.
 */
const DashboardTables = dynamic(() => import('@/components/admin/DashboardTables'), {
  ssr: false,
  loading: () => (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <TableSkeleton />
        <TableSkeleton />
      </div>
      <TableSkeleton />
    </>
  ),
});

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

  // Header renders immediately in every state so the page never looks blank.
  const pageHeader = (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em] text-white">Dashboard</h1>
      {/* Plain label, not a control: there is no date-range filter behind it. */}
      <p className="text-sm text-[#9ca3af]">{todayLabel}</p>
    </div>
  );

  // Only reached on a genuinely cold load — a warm cache renders data directly.
  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        {pageHeader}
        <div className={STAT_GRID} aria-hidden="true">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton className={STAT_SPAN_LAST} />
        </div>
        <div className="space-y-3">
          <div className="h-5 w-24 animate-pulse rounded bg-white/[0.08]" />
          <div className={STAT_GRID} aria-hidden="true">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton className={STAT_SPAN_LAST} />
          </div>
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="space-y-5">
        {pageHeader}
        <div className="rounded-xl border border-red-500/25 bg-red-500/[0.07] p-5">
          <p className="text-sm text-red-300">{error || 'Failed to load dashboard metrics'}</p>
          <button onClick={() => refetch(true)} className="btn btn-primary mt-4">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pageHeader}

      {/* Most actionable fact on the page, promoted above the metrics */}
      {metrics.orders.pending > 0 && (
        <PendingOrdersReviewBanner count={metrics.orders.pending} />
      )}

      {/* Primary metrics — three even columns */}
      <div className={STAT_GRID}>
        <CustomerMetricsCard
          total={metrics.customers.total}
          active={metrics.customers.active}
          disabled={metrics.customers.disabled}
        />
        <StatCard
          label="Total Orders"
          value={metrics.orders.total}
          icon={<ShoppingCart className="h-4 w-4" />}
          description={`${metrics.orders.pending} pending`}
          color="green"
        />
        <div className={STAT_SPAN_LAST}>
          <StatCard
            label="Total Leads"
            value={metrics.leads.total}
            icon={<Target className="h-4 w-4" />}
            description={`${metrics.leads.thisMonth} this month`}
            color="green"
          />
        </div>
      </div>

      {/* Revenue */}
      <section className="space-y-3">
        <h2 className={SECTION_TITLE}>Revenue</h2>
        <div className={STAT_GRID}>
          <StatCard
            label="Total Revenue"
            value={formatInrCurrency.format(metrics.revenue.total)}
            icon={<IndianRupee className="h-4 w-4" />}
            color="green"
          />
          <StatCard
            label={"Today's Revenue"}
            value={formatInrCurrency.format(metrics.revenue.today)}
            icon={<CalendarDays className="h-4 w-4" />}
            color="green"
          />
          <div className={STAT_SPAN_LAST}>
            <StatCard
              label="Monthly Revenue"
              value={formatInrCurrency.format(metrics.revenue.thisMonth)}
              icon={<CalendarRange className="h-4 w-4" />}
              color="green"
            />
          </div>
        </div>
      </section>

      {/* Order Volume */}
      <section className="space-y-3">
        <h2 className={SECTION_TITLE}>Order Volume</h2>
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
          <StatCard
            label="Completed Orders"
            value={metrics.orders.completed}
            icon={<CheckCircle2 className="h-4 w-4" />}
            color="green"
          />
          <StatCard
            label="Pending Orders"
            value={metrics.orders.pending}
            icon={<Clock className="h-4 w-4" />}
            color="orange"
          />
        </div>
      </section>

      {/* Tables — lazily loaded so the cards above paint first */}
      <DashboardTables
        orderStatusRows={orderStatusRows}
        revenueRows={revenueRows}
        recentOrders={recentOrders}
      />

      {/* Footer */}
      <p className="border-t border-white/[0.08] pt-6 text-center text-xs text-[#9ca3af]">
        © {new Date().getFullYear()} Tapvyo Admin Panel · All rights reserved
      </p>
    </div>
  );
}
