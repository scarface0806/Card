'use client';

import React from 'react';
import DataTable from '@/components/admin/DataTable';
import { Plus } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">View and manage all orders</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          New Order
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'customer', label: 'Customer Name' },
          { key: 'orderID', label: 'Order ID' },
          { key: 'orderDate', label: 'Order Date' },
          { key: 'subtotal', label: 'Subtotal', width: '100px' },
          { key: 'total', label: 'Total', width: '100px' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => {
              const colors = {
                completed: 'bg-green-100 text-green-800',
                pending: 'bg-yellow-100 text-yellow-800',
                cancelled: 'bg-red-100 text-red-800',
              };
              return (
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
                }`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    status === 'completed' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></span>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              );
            },
          },
        ]}
        data={ordersData}
        onView={handleView}
        onDelete={handleDelete}
      />
    </main>
  );
}
