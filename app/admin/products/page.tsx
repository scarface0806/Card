'use client';

import React from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { Plus, Package, Clock, Filter } from 'lucide-react';

const productsData = [
  { sno: 1, customer: 'John Doe', mobile: '+1 234 567 8900', country: 'USA', createdDate: '2024-02-15', expiredDate: '2025-02-15', status: 'active' },
  { sno: 2, customer: 'Jane Smith', mobile: '+1 234 567 8901', country: 'USA', createdDate: '2024-02-16', expiredDate: '2025-02-16', status: 'active' },
  { sno: 3, customer: 'Bob Johnson', mobile: '+1 234 567 8902', country: 'UK', createdDate: '2024-02-17', expiredDate: '2024-08-17', status: 'inactive' },
  { sno: 4, customer: 'Alice Brown', mobile: '+1 234 567 8903', country: 'Canada', createdDate: '2024-02-18', expiredDate: '2025-02-18', status: 'active' },
];

export default function ProductsPage() {
  const handleView = (row: any) => alert(`Viewing product for: ${row.customer}`);
  const handleDelete = (row: any) => alert(`Deleting product for: ${row.customer}`);

  return (
    <main className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Active Products</h1>
          <p className="text-gray-400 text-sm mt-1">Manage activated NFC card profiles and subscription status</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/5">
            <Clock className="w-4 h-4 text-orange-400" />
            Remind Expiring
          </button>
          <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all font-medium active:scale-95">
            <Package className="w-4 h-4 ml-[-5px]" />
            New Link
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'customer', label: 'Customer' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'country', label: 'Country' },
          { key: 'createdDate', label: 'Created' },
          { key: 'expiredDate', label: 'Expires' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => (
              <StatusBadge status={status === 'active' ? 'active' : 'cancelled'} />
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
