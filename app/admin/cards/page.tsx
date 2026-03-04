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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Cards</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and customize NFC card products and designs</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all font-medium active:scale-95">
          <Plus className="w-4 h-4 ml-[-5px]" />
          Add New Card
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'name', label: 'Card Name' },
          { key: 'description', label: 'Description' },
          { key: 'type', label: 'Card Type', width: '120px' },
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
