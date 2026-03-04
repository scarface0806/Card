'use client';

import React, { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { RotateCw, Mail, MessageSquare, Filter } from 'lucide-react';

const contactsData = [
  { sno: 1, name: 'John Doe', email: 'john@example.com', phone: '+1 234 567 8900', comments: 'Interested in bulk order', status: 'pending' },
  { sno: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1 234 567 8901', comments: 'Need custom design', status: 'active' },
  { sno: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+1 234 567 8902', comments: 'Partnership inquiry', status: 'pending' },
  { sno: 4, name: 'Alice Brown', email: 'alice@example.com', phone: '+1 234 567 8903', comments: 'Product inquiry', status: 'pending' },
];

export default function ContactsPage() {
  const [data, setData] = useState(contactsData);

  const handleRefresh = () => {
    alert('Refreshing contacts...');
    setData([...data]);
  };

  const handleView = (row: any) => alert(`Viewing: ${row.name}\nComment: ${row.comments}`);
  const handleDelete = (row: any) => alert(`Deleting contact: ${row.name}`);

  return (
    <main className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Contacts</h1>
          <p className="text-gray-400 text-sm mt-1">View and respond to customer inquiries and support messages</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/5">
            <Filter className="w-4 h-4" />
            Filter
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
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'comments', label: 'Message Preview' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => (
              <StatusBadge status={status === 'active' ? 'completed' : status as any} />
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
