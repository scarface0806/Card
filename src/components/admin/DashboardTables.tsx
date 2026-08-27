'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';

/**
 * The three below-the-fold table blocks, split into their own chunk so that
 * DataTable (and its pagination/badge tree) is not part of the dashboard
 * route's initial JavaScript. The page loads this lazily, letting the stat
 * cards paint first.
 *
 * Presentational only: every row is computed by the page and passed in.
 */

const SECTION_TITLE = 'text-base font-semibold tracking-tight text-white';
const SECTION_LINK =
  'flex items-center gap-1.5 text-xs font-medium text-green-400 transition-colors duration-200 hover:text-green-300';

type StatusTone = 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled';

export type OrderStatusRow = { status: string; count: number; health: StatusTone };
export type RevenueRow = { label: string; value: string };
export type RecentOrderRow = {
  id: string;
  orderNum: string;
  customer: string;
  date: string;
  total: string;
  status: StatusTone;
};

interface DashboardTablesProps {
  orderStatusRows: OrderStatusRow[];
  revenueRows: RevenueRow[];
  recentOrders: RecentOrderRow[];
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h2 className={SECTION_TITLE}>{title}</h2>
      <Link href="/admin/orders" className={SECTION_LINK}>
        View all <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default function DashboardTables({
  orderStatusRows,
  revenueRows,
  recentOrders,
}: DashboardTablesProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Order Status Summary */}
        <div className="min-w-0 space-y-3">
          <SectionHeader title="Order Status" />
          <DataTable
            columns={[
              { key: 'status', label: 'Status' },
              { key: 'count', label: 'Count' },
              {
                key: 'health',
                label: 'Status Badge',
                render: (_value, row) => <StatusBadge status={(row as OrderStatusRow).health} />,
              },
            ]}
            data={orderStatusRows}
            actions={false}
            itemsPerPage={5}
          />
        </div>

        {/* Revenue Snapshot */}
        <div className="min-w-0 space-y-3">
          <SectionHeader title="Revenue Snapshot" />
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
      <div className="min-w-0 space-y-3">
        <SectionHeader title="Recent Orders" />
        <DataTable
          columns={[
            { key: 'orderNum', label: 'Order ID', width: '170px' },
            { key: 'customer', label: 'Customer' },
            { key: 'date', label: 'Date', width: '120px' },
            { key: 'total', label: 'Total', width: '80px' },
            {
              key: 'status',
              label: 'Status',
              render: (status) => <StatusBadge status={status as StatusTone} />,
            },
          ]}
          data={recentOrders}
          actions={false}
          itemsPerPage={10}
        />
      </div>
    </>
  );
}
