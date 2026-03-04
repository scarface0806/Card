'use client';

import React from 'react';
import DataTable from '@/components/admin/DataTable';
import { Plus } from 'lucide-react';

const productsData = [
  { sno: 1, customer: 'John Doe', mobile: '+1 234 567 8900', country: 'USA', createdDate: '2024-02-15', expiredDate: '2025-02-15', status: 'active' },
  { sno: 2, customer: 'Jane Smith', mobile: '+1 234 567 8901', country: 'USA', createdDate: '2024-02-16', expiredDate: '2025-02-16', status: 'active' },
  { sno: 3, customer: 'Bob Johnson', mobile: '+1 234 567 8902', country: 'UK', createdDate: '2024-02-17', expiredDate: '2024-08-17', status: 'expired' },
  { sno: 4, customer: 'Alice Brown', mobile: '+1 234 567 8903', country: 'Canada', createdDate: '2024-02-18', expiredDate: '2025-02-18', status: 'active' },
];

export default function ProductsPage() {
  const handleView = (row: any) => alert(`Viewing product for: ${row.customer}`);
  const handleDelete = (row: any) => alert(`Deleting product for: ${row.customer}`);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">List of card products created by customers</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          Add Product
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'customer', label: 'Customer Name' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'country', label: 'Country' },
          { key: 'createdDate', label: 'Created Date' },
          { key: 'expiredDate', label: 'Expired Date' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => (
              <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <span className={`inline-block w-2 h-2 rounded-full ${
                  status === 'active' ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            ),
          },
        ]}
        data={productsData}
        onView={handleView}
        onDelete={handleDelete}
      />
    </main>
  );
}
