'use client';

import React, { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import { Plus } from 'lucide-react';

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage all your customers</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          Add New
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
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full ${
                  status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                }`}></span>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
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
