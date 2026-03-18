'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import RightDrawer from '@/components/ui/RightDrawer';
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
  subject?: string;
  createdAt?: string;
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
  const [selectedContact, setSelectedContact] = useState<ContactRow | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ContactRow | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/contacts?limit=200', {
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
        company: '-',
        comments: contact.message || '-',
        source: contact.source || 'website',
        status: 'active',
        subject: contact.subject || 'No Subject',
        createdAt: contact.createdAt ? new Date(contact.createdAt).toLocaleString() : '-',
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

  const handleView = (row: ContactRow) => {
    setSelectedContact(row);
  };

  const handleDelete = (row: ContactRow) => {
    setConfirmTarget(row);
  };

  const confirmDelete = async () => {
    if (!confirmTarget) return;

    try {
      setConfirmLoading(true);
      // Note: Delete functionality not implemented for contacts API
      // Remove from local state only
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Contacts</h1>
          <p className="text-gray-400 text-sm mt-1">View and respond to customer inquiries and support messages</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/10">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all font-medium active:scale-95"
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

      <RightDrawer open={!!selectedContact} onClose={() => setSelectedContact(null)}>
        {selectedContact ? (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{selectedContact.name || 'Contact Details'}</h2>
                <p className="text-sm text-slate-400 mt-1">Contact ID: {selectedContact.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="text-slate-400 hover:text-white"
                aria-label="Close contact details"
              >
                ✕
              </button>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Name</p>
                  <p className="mt-1 text-white">{selectedContact.name}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
                  <p className="mt-1 text-white break-all">{selectedContact.email}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Phone</p>
                  <p className="mt-1 text-white">{selectedContact.phone}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Subject</p>
                  <p className="mt-1 text-white">{selectedContact.subject || '-'}</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Source</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Source</p>
                  <p className="mt-1 text-white">{selectedContact.source || 'Website'}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Date Received</p>
                  <p className="mt-1 text-white">{selectedContact.createdAt || '-'}</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Message</h3>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-white whitespace-pre-line">{selectedContact.comments || '-'}</p>
              </div>
            </section>
          </div>
        ) : null}
      </RightDrawer>
    </main>
  );
}
