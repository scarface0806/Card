'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DataTable from '@/components/admin/DataTable';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import StatusBadge from '@/components/admin/StatusBadge';
import { Copy, RefreshCw, UserPlus } from 'lucide-react';

interface CustomerRow {
  id: string;
  sno: number;
  name: string;
  phone: string;
  email: string;
  slug: string;
  status: 'active' | 'inactive';
  nfcLink: string;
  createdDate: string;
}

interface ToastState {
  variant: 'success' | 'error' | 'info';
  message: string;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: 'disable' | 'delete'; customer: CustomerRow } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/customers?limit=200', {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch customers');
      }

      const data = await response.json();
      const mapped: CustomerRow[] = (data.customers || []).map((customer: any, index: number) => ({
        id: customer.id,
        sno: index + 1,
        name: customer.name || 'Unnamed',
        phone: customer.phone || '-',
        email: customer.email || '-',
        slug: customer.slug,
        status: customer.isActive ? 'active' : 'inactive',
        nfcLink: customer.nfcLink,
        createdDate: new Date(customer.createdAt).toLocaleDateString(),
      }));

      setCustomers(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setToast({ variant: 'success', message: 'NFC link copied to clipboard' });
    } catch {
      setToast({ variant: 'error', message: 'Failed to copy NFC link' });
    }
  };

  const handleView = (row: CustomerRow) => {
    window.open(row.nfcLink, '_blank', 'noopener,noreferrer');
  };

  const handleEdit = (row: CustomerRow) => {
    router.push(`/admin/customers/${row.id}/edit`);
  };

  const handleToggleStatus = (row: CustomerRow) => {
    setConfirmAction({ type: 'disable', customer: row });
  };

  const handleDelete = (row: CustomerRow) => {
    setConfirmAction({ type: 'delete', customer: row });
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;

    try {
      setConfirmLoading(true);

      if (confirmAction.type === 'delete') {
        const response = await fetch(`/api/admin/customers/${confirmAction.customer.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to delete customer');
        }

        setToast({ variant: 'success', message: 'Customer deleted successfully' });
      } else {
        const response = await fetch(`/api/admin/customers/${confirmAction.customer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ isActive: confirmAction.customer.status !== 'active' }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || 'Failed to update customer status');
        }

        setToast({
          variant: 'success',
          message: confirmAction.customer.status === 'active' ? 'Customer disabled successfully' : 'Customer enabled successfully',
        });
      }

      setConfirmAction(null);
      fetchCustomers();
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Customers</h1>
          <p className="text-gray-400 text-sm mt-1">Manage all your customer accounts and their information</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCustomers}
            className="flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/5"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/customers/create')}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all font-medium active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            Create NFC Customer
          </button>
        </div>
      </div>

      {error && <AdminToast variant="error" message={error} onClose={() => setError(null)} />}
      {toast && <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}
      <AdminConfirmPanel
        open={!!confirmAction}
        title={confirmAction?.type === 'delete' ? 'Delete customer' : 'Change customer status'}
        description={confirmAction?.type === 'delete'
          ? `Delete ${confirmAction.customer.name}? This action cannot be undone.`
          : `${confirmAction?.customer.status === 'active' ? 'Disable' : 'Enable'} ${confirmAction?.customer.name}? Disabled customers cannot open profile pages.`}
        confirmText={confirmAction?.type === 'delete' ? 'Delete Customer' : confirmAction?.customer.status === 'active' ? 'Disable Customer' : 'Enable Customer'}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmAction}
        loading={confirmLoading}
        tone={confirmAction?.type === 'delete' ? 'danger' : 'warning'}
      />

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'name', label: 'Customer Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'slug', label: 'Slug' },
          {
            key: 'status',
            label: 'Status',
            render: (value: CustomerRow['status']) => <StatusBadge status={value === 'active' ? 'active' : 'inactive'} />,
          },
          {
            key: 'nfcLink',
            label: 'NFC Link',
            render: (value: string, row: CustomerRow) => (
              <div className="flex items-center gap-2">
                <span className="max-w-[220px] truncate text-gray-300">{value}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(row.nfcLink)}
                  className="rounded-lg p-2 text-orange-400 transition hover:bg-orange-500/10"
                  aria-label={`Copy NFC link for ${row.name}`}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            ),
          },
          { key: 'createdDate', label: 'Created Date' },
        ]}
        data={loading ? [] : customers}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
        actionLabels={{ view: 'View', edit: 'Edit', delete: 'Delete' }}
        extraActions={[
          {
            key: 'disable',
            label: (row: CustomerRow) => (row.status === 'active' ? 'Disable' : 'Enable'),
            onClick: handleToggleStatus,
            tone: 'warning',
          },
        ]}
      />

      {!loading && customers.length > 0 ? (
        <div className="rounded-xl border border-white/5 bg-[#161b2e] px-5 py-4 text-sm text-gray-400">
          Customer creation now generates a live NFC profile link automatically. Use the copy action to write the URL to a physical NFC card.
        </div>
      ) : null}
    </main>
  );
}
