'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import { RotateCw, Filter } from 'lucide-react';

interface ContactRow {
  id: string;
  sno: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  comments: string;
  source: string;
  status: 'pending' | 'active';
}

interface ToastState {
  variant: 'success' | 'error' | 'info';
  message: string;
}

export default function ContactsPage() {
  const [data, setData] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ContactRow | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/contacts?limit=200', {
        credentials: 'include',
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to fetch contacts');
      }

      const mapped: ContactRow[] = (payload.contacts || []).map((contact: any, index: number) => ({
        id: contact.id,
        sno: index + 1,
        name: contact.name || 'Unknown',
        email: contact.email || '-',
        phone: contact.phone || '-',
        company: contact.company || '-',
        comments: contact.message || '-',
        source: contact.source || 'contact_form',
        status: contact.isRead ? 'active' : 'pending',
      }));

      setData(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleRefresh = () => {
    fetchContacts();
  };

  const handleView = async (row: ContactRow) => {
    if (row.status === 'pending') {
      try {
        await fetch('/api/admin/contacts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: row.id, isRead: true }),
        });
        setData((prev) => prev.map((item) => (item.id === row.id ? { ...item, status: 'active' } : item)));
      } catch {
        setToast({ variant: 'error', message: 'Failed to update contact read state' });
      }
    }

    setToast({
      variant: 'info',
      message: `${row.name} | ${row.email} | ${row.phone} | ${row.company} | ${row.comments}`,
    });
  };

  const handleDelete = (row: ContactRow) => {
    setConfirmTarget(row);
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;

    try {
      setConfirmLoading(true);
      const response = await fetch(`/api/admin/contacts?id=${encodeURIComponent(confirmTarget.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to delete contact');
      }

      setData((prev) => prev.filter((item) => item.id !== confirmTarget.id));
      setToast({ variant: 'success', message: `Deleted contact from ${confirmTarget.name}` });
      setConfirmTarget(null);
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to delete contact' });
    } finally {
      setConfirmLoading(false);
    }
  };

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

      {error && <AdminToast variant="error" message={error} onClose={() => setError(null)} />}
      {toast && <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}

      <AdminConfirmPanel
        open={!!confirmTarget}
        title="Delete contact"
        description={confirmTarget ? `Delete inquiry from ${confirmTarget.name}?` : ''}
        confirmText="Delete Contact"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmDelete}
        loading={confirmLoading}
        tone="danger"
      />

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email' },
          { key: 'phone', label: 'Phone' },
          { key: 'company', label: 'Company' },
          { key: 'source', label: 'Source' },
          { key: 'comments', label: 'Message Preview' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => <StatusBadge status={status === 'active' ? 'completed' : (status as any)} />,
          },
        ]}
        data={loading ? [] : data}
        onView={handleView}
        onDelete={handleDelete}
      />
    </main>
  );
}
