'use client';

import React from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Plus, ShoppingCart, Download, Filter } from 'lucide-react';

const ordersData = [
  { sno: 1, customer: 'John Doe', orderID: 'ORD-001', orderDate: '2024-03-01', subtotal: '$299.99', total: '$349.99', status: 'completed' },
  { sno: 2, customer: 'Jane Smith', orderID: 'ORD-002', orderDate: '2024-03-02', subtotal: '$149.99', total: '$179.99', status: 'pending' },
  { sno: 3, customer: 'Bob Johnson', orderID: 'ORD-003', orderDate: '2024-03-03', subtotal: '$399.99', total: '$450.00', status: 'cancelled' },
  { sno: 4, customer: 'Alice Brown', orderID: 'ORD-004', orderDate: '2024-03-04', subtotal: '$199.99', total: '$229.99', status: 'completed' },
];

export default function OrdersPage() {
  const handleView = (row: any) => alert(`Viewing order: ${row.orderID}`);
  const handleDelete = (row: any) => alert(`Deleting order: ${row.orderID}`);

  return (
    <main className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Orders</h1>
          <p className="text-gray-400 text-sm mt-1">Manage customer orders and track fulfillment status</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/5">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all font-medium active:scale-95">
            <ShoppingCart className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'customer', label: 'Customer' },
          { key: 'orderID', label: 'Order ID' },
          { key: 'orderDate', label: 'Order Date' },
          { key: 'subtotal', label: 'Subtotal' },
          { key: 'total', label: 'Total' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => (
              <StatusBadge status={status as any} />
            ),
          },
        ]}
        data={ordersData}
        onView={handleView}
        onDelete={handleDelete}
      />
    </main>
  );
}
