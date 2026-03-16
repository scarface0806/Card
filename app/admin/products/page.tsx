'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import { Package, Clock, RefreshCw } from 'lucide-react';

interface ProductRow {
  id: string;
  sno: number;
  name: string;
  category: string;
  cardType: string;
  stock: number;
  price: string;
  createdDate: string;
  status: 'active' | 'inactive';
}

interface ToastState {
  variant: 'success' | 'error' | 'info';
  message: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ProductRow | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/products?showAll=true&limit=200', {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch products');
      }

      const data = await response.json();
      const mapped: ProductRow[] = (data.products || []).map((product: any, index: number) => ({
        id: product.id,
        sno: index + 1,
        name: product.name,
        category: product.category || '-',
        cardType: product.cardType || '-',
        stock: product.stock || 0,
        price: `₹${(product.salePrice || product.price || 0).toLocaleString()}`,
        createdDate: new Date(product.createdAt).toLocaleDateString(),
        status: product.isActive ? 'active' : 'inactive',
      }));

      setProducts(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleView = (row: ProductRow) => {
    setToast({ variant: 'info', message: `Product ${row.name} | ${row.cardType} | ${row.price}` });
  };

  const handleDelete = (row: ProductRow) => {
    setConfirmTarget(row);
  };

  const confirmToggle = async () => {
    if (!confirmTarget) return;

    const nextIsActive = confirmTarget.status !== 'active';
    const actionLabel = nextIsActive ? 'activate' : 'deactivate';

    try {
      setConfirmLoading(true);
      const response = await fetch(`/api/products/${confirmTarget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isActive: nextIsActive }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${actionLabel} product`);
      }

      await fetchProducts();
      setToast({ variant: 'success', message: `Product ${confirmTarget.name} ${actionLabel}d successfully` });
      setConfirmTarget(null);
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : `Failed to ${actionLabel} product` });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Active Products</h1>
          <p className="text-gray-400 text-sm mt-1">Manage activated NFC card profiles and subscription status</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/10">
            <Clock className="w-4 h-4 text-orange-400" />
            Remind Expiring
          </button>
          <button
            onClick={fetchProducts}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/10"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all font-medium active:scale-95">
            <Package className="w-4 h-4 ml-[-5px]" />
            New Link
          </button>
        </div>
      </div>

      {error && <AdminToast variant="error" message={error} onClose={() => setError(null)} />}
      {toast && <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}

      <AdminConfirmPanel
        open={!!confirmTarget}
        title="Confirm product status"
        description={confirmTarget ? `${confirmTarget.status === 'active' ? 'Deactivate' : 'Activate'} ${confirmTarget.name}?` : ''}
        confirmText="Update Product"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmToggle}
        loading={confirmLoading}
        tone="warning"
      />

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'name', label: 'Product' },
          { key: 'category', label: 'Category' },
          { key: 'cardType', label: 'Card Type' },
          { key: 'stock', label: 'Stock', width: '80px' },
          { key: 'price', label: 'Price', width: '100px' },
          { key: 'createdDate', label: 'Created' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => <StatusBadge status={status === 'active' ? 'active' : 'inactive'} />,
          },
        ]}
        data={loading ? [] : products}
        onView={handleView}
        onDelete={handleDelete}
      />
    </main>
  );
}
