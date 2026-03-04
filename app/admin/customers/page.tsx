'use client';

import React, { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Plus, UserPlus } from 'lucide-react';

const customerData = [
  { sno: 1, name: 'John Doe', mobile: '+1 234 567 8900', country: 'USA', createdDate: '2024-02-15', status: 'active' },
  { sno: 2, name: 'Jane Smith', mobile: '+1 234 567 8901', country: 'USA', createdDate: '2024-02-16', status: 'active' },
  { sno: 3, name: 'Bob Johnson', mobile: '+1 234 567 8902', country: 'UK', createdDate: '2024-02-17', status: 'inactive' },
  { sno: 4, name: 'Alice Brown', mobile: '+1 234 567 8903', country: 'Canada', createdDate: '2024-02-18', status: 'active' },
  { sno: 5, name: 'Charlie Davis', mobile: '+1 234 567 8904', country: 'USA', createdDate: '2024-02-19', status: 'active' },
];

export default function CustomersPage() {
  const handleView = (row: any) => alert(`Viewing customer: ${row.name}`);
  const handleDelete = (row: any) => alert(`Deleting customer: ${row.name}`);

  return (
    <main className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Customers</h1>
          <p className="text-gray-400 text-sm mt-1">Manage all your customer accounts and their information</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all font-medium active:scale-95">
          <UserPlus className="w-4 h-4" />
          Add New Customer
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'name', label: 'Customer Name' },
          { key: 'mobile', label: 'Mobile Number' },
          { key: 'country', label: 'Country' },
          { key: 'createdDate', label: 'Created Date' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => (
              <StatusBadge
                status={status === 'active' ? 'active' : 'inactive'}
              />
            ),
          },
        ]}
        data={customerData}
        onView={handleView}
        onDelete={handleDelete}
      />
    </main>
  );
}
