'use client';

import React, { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import { RotateCw } from 'lucide-react';

const newslettersData = [
  { sno: 1, email: 'john@example.com', date: '2024-01-15', status: 'active' },
  { sno: 2, email: 'jane@example.com', date: '2024-01-20', status: 'active' },
  { sno: 3, email: 'bob@example.com', date: '2024-02-01', status: 'unsubscribed' },
  { sno: 4, email: 'alice@example.com', date: '2024-02-10', status: 'active' },
  { sno: 5, email: 'charlie@example.com', date: '2024-02-15', status: 'active' },
];

export default function NewslettersPage() {
  const [data, setData] = useState(newslettersData);

  const handleRefresh = () => {
    alert('Refreshing newsletters...');
    setData([...data]);
  };

  const handleView = (row: any) => alert(`Viewing: ${row.email}`);
  const handleDelete = (row: any) => alert(`Removing subscriber: ${row.email}`);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletters</h1>
          <p className="text-gray-600 mt-1">Manage newsletter subscribers</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <RotateCw className="w-5 h-5" />
          Refresh
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'email', label: 'Email ID' },
          { key: 'date', label: 'Subscription Date' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => {
              const colors = {
                active: 'bg-green-100 text-green-800',
                unsubscribed: 'bg-red-100 text-red-800',
              };
              return (
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
                }`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    status === 'active' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              );
            },
          },
        ]}
        data={data}
        onView={handleView}
        onDelete={handleDelete}
      />
    </main>
  );
}
