'use client';

import React, { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { RotateCw, Mail, Send, Filter } from 'lucide-react';

const newslettersData = [
  { sno: 1, email: 'john@example.com', date: '2024-01-15', status: 'active' },
  { sno: 2, email: 'jane@example.com', date: '2024-01-20', status: 'active' },
  { sno: 3, email: 'bob@example.com', date: '2024-02-01', status: 'inactive' },
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Newsletters</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your email subscriber list and newsletter campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/5">
            <Send className="w-4 h-4 text-orange-400" />
            Send Campaign
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all font-medium active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'email', label: 'Email Address' },
          { key: 'date', label: 'Subscribed On' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => (
              <StatusBadge status={status === 'inactive' ? 'cancelled' : status as any} />
            ),
          },
        ]}
        data={data}
        onView={handleView}
        onDelete={handleDelete}
      />
    </main>
  );
}
