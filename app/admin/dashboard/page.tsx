'use client';

import React, { useState } from 'react';
import StatCard from '@/components/admin/StatCard';
import DataTable from '@/components/admin/DataTable';
import { Users, CreditCard, Package, ShoppingCart } from 'lucide-react';

// Mock data for tables
const recentCustomers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '+1 234 567 8900', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '+1 234 567 8901', status: 'active' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: '+1 234 567 8902', status: 'inactive' },
];

const recentCards = [
  { id: 1, name: 'Premium Card', description: 'Gold plated card', status: 'active' },
  { id: 2, name: 'Silver Card', description: 'Silver design', status: 'active' },
  { id: 3, name: 'Bronze Card', description: 'Bronze finish', status: 'inactive' },
];

const recentOrders = [
  { id: 1, orderNum: 'ORD-001', customer: 'John Doe', date: '2024-03-01', total: '$299.99', status: 'completed' },
  { id: 2, orderNum: 'ORD-002', customer: 'Jane Smith', date: '2024-03-02', total: '$149.99', status: 'pending' },
  { id: 3, orderNum: 'ORD-003', customer: 'Bob Johnson', date: '2024-03-03', total: '$399.99', status: 'cancelled' },
];

export default function Dashboard() {
  const [stats] = useState({
    totalCustomers: 1234,
    totalCards: 456,
    totalOrders: 789,
    totalSubscriptions: 345,
  });

  return (
    <main className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's your business overview.</p>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Total Customers"
          value={stats.totalCustomers}
          icon="👥"
          trend={{ value: 12, isPositive: true }}
          color="blue"
        />
        <StatCard
          label="Total Cards"
          value={stats.totalCards}
          icon="🎨"
          trend={{ value: 8, isPositive: true }}
          color="purple"
        />
        <StatCard
          label="Total Orders"
          value={stats.totalOrders}
          icon="🛒"
          trend={{ value: 5, isPositive: false }}
          color="green"
        />
        <StatCard
          label="Total Subscriptions"
          value={stats.totalSubscriptions}
          icon="📧"
          trend={{ value: 15, isPositive: true }}
          color="orange"
        />
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <DataTable
          title="Recent Customers"
          columns={[
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              ),
            },
          ]}
          data={recentCustomers}
          actions={false}
          itemsPerPage={5}
        />

        {/* Recent Cards */}
        <DataTable
          title="Recent Cards"
          columns={[
            { key: 'name', label: 'Card Name' },
            { key: 'description', label: 'Description' },
            {
              key: 'status',
              label: 'Status',
              render: (status) => (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              ),
            },
          ]}
          data={recentCards}
          actions={false}
          itemsPerPage={5}
        />
      </div>

      {/* Recent Orders */}
      <DataTable
        title="Recent Orders"
        columns={[
          { key: 'orderNum', label: 'Order ID', width: '120px' },
          { key: 'customer', label: 'Customer' },
          { key: 'date', label: 'Date', width: '120px' },
          { key: 'total', label: 'Total', width: '100px' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => {
              const statusColors = {
                completed: 'bg-blue-100 text-blue-800',
                pending: 'bg-yellow-100 text-yellow-800',
                cancelled: 'bg-red-100 text-red-800',
              };
              return (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                }`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              );
            },
          },
        ]}
        data={recentOrders}
        actions={false}
        itemsPerPage={10}
      />
    </main>
  );
}
