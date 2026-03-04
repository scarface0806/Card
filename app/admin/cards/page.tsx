'use client';

import React from 'react';
import DataTable from '@/components/admin/DataTable';
import { Plus } from 'lucide-react';

const cardsData = [
  { sno: 1, name: 'Premium Gold Card', description: 'Luxury gold plated card', type: 'Premium', material: 'Gold', price: '$99.99' },
  { sno: 2, name: 'Silver Card', description: 'Elegant silver design', type: 'Standard', material: 'Silver', price: '$49.99' },
  { sno: 3, name: 'Bronze Card', description: 'Classic bronze finish', type: 'Standard', material: 'Bronze', price: '$39.99' },
  { sno: 4, name: 'Platinum Card', description: 'Exclusive platinum card', type: 'Premium', material: 'Platinum', price: '$149.99' },
  { sno: 5, name: 'Wooden Card', description: 'Eco-friendly wooden card', type: 'Eco', material: 'Wood', price: '$29.99' },
];

export default function CardsPage() {
  const handleEdit = (row: any) => alert(`Editing card: ${row.name}`);
  const handleDelete = (row: any) => alert(`Deleting card: ${row.name}`);

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cards</h1>
          <p className="text-gray-600 mt-1">Manage NFC card designs and variations</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Plus className="w-5 h-5" />
          Add New Card
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'name', label: 'Card Name' },
          { key: 'description', label: 'Description' },
          { key: 'type', label: 'Card Type', width: '100px' },
          { key: 'material', label: 'Material', width: '100px' },
          { key: 'price', label: 'Price', width: '100px' },
        ]}
        data={cardsData}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </main>
  );
}
