'use client';

import React, { useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import { RotateCw } from 'lucide-react';

const contactsData = [
  { sno: 1, name: 'John Doe', email: 'john@example.com', phone: '+1 234 567 8900', comments: 'Interested in bulk order', status: 'new' },
  { sno: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1 234 567 8901', comments: 'Need custom design', status: 'responded' },
  { sno: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+1 234 567 8902', comments: 'Partnership inquiry', status: 'pending' },
  { sno: 4, name: 'Alice Brown', email: 'alice@example.com', phone: '+1 234 567 8903', comments: 'Product inquiry', status: 'new' },
];

export default function ContactsPage() {
  const [data, setData] = useState(contactsData);

  const handleRefresh = () => {
    alert('Refreshing contacts...');
    // Simulate refresh
    setData([...data]);
  };

  const handleView = (row: any) => alert(`Viewing: ${row.name}\nComment: ${row.comments}`);
  const handleDelete = (row: any) => alert(`Deleting contact: ${row.name}`);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contacts</h1>
          <p className="text-gray-600 mt-1">View and manage contact form submissions</p>
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
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'comments', label: 'Comments' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => {
              const colors = {
                new: 'bg-blue-100 text-blue-800',
                responded: 'bg-green-100 text-green-800',
                pending: 'bg-yellow-100 text-yellow-800',
              };
              return (
                <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
                }`}>
                  <span className={`inline-block w-2 h-2 rounded-full`}></span>
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
