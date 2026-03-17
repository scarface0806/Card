'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import AdminToast from '@/components/admin/AdminToast';
import RightDrawer from '@/components/ui/RightDrawer';

interface LeadRow {
  id: string;
  sno: number;
  name: string;
  phone: string;
  email: string;
  service: string;
  message: string;
  date: string;
}

interface ToastState {
  variant: 'success' | 'error' | 'info';
  message: string;
}

export default function AdminLeadsPage() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [viewLead, setViewLead] = useState<LeadRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/leads?type=main&limit=200', {
        credentials: 'include',
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to fetch leads');
      }

      const mapped: LeadRow[] = (payload.leads || []).map((lead: any, index: number) => ({
        id: lead.id,
        sno: index + 1,
        name: lead.name || '-',
        phone: lead.phone,
        email: lead.email || '-',
        service: lead.service || '-',
        message: lead.message || '-',
        date: new Date(lead.createdAt).toLocaleString(),
      }));

      setRows(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteLead = useCallback(async (row: LeadRow) => {
    if (!window.confirm(`Delete lead from "${row.name}"? This cannot be undone.`)) return;

    const previous = rows;
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setDeletingId(row.id);

    try {
      const res = await fetch(`/api/admin/leads/${row.id}?type=main`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || payload.message || 'Failed to delete lead');
      setToast({ variant: 'success', message: 'Lead deleted successfully' });
    } catch (err) {
      setRows(previous);
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to delete lead' });
    } finally {
      setDeletingId(null);
    }
  }, [rows]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Main Website Leads</h1>
          <p className="mt-1 text-sm text-gray-400">Leads captured from website service and contact forms.</p>
        </div>
        <button
          type="button"
          onClick={fetchLeads}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#2a3048] px-4 py-2.5 font-medium text-white transition hover:bg-[#313755]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {error ? <AdminToast variant="error" message={error} onClose={() => setError(null)} /> : null}
      {toast ? <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} /> : null}

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'name', label: 'Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'email', label: 'Email' },
          { key: 'service', label: 'Service' },
          {
            key: 'message',
            label: 'Message',
            render: (value: string) => <span className="line-clamp-2 max-w-[320px] text-gray-300">{value}</span>,
          },
          { key: 'date', label: 'Date' },
        ]}
        data={loading ? [] : rows}
        onView={(row: LeadRow) => setViewLead(row)}
        onDelete={deleteLead}
        actionTones={{ delete: 'danger' }}
      />

      <RightDrawer open={!!viewLead} onClose={() => setViewLead(null)}>
        {viewLead ? (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700 pb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">{viewLead.name || 'Lead Details'}</h2>
                <p className="text-sm text-slate-400 mt-1">Lead ID: {viewLead.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewLead(null)}
                className="text-slate-400 hover:text-white"
                aria-label="Close lead details"
              >
                ✕
              </button>
            </div>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Lead Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Name</p>
                  <p className="mt-1 text-white">{viewLead.name}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
                  <p className="mt-1 text-white break-all">{viewLead.email}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Phone</p>
                  <p className="mt-1 text-white">{viewLead.phone}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Company</p>
                  <p className="mt-1 text-white">-</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Lead Source</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Campaign</p>
                  <p className="mt-1 text-white">-</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Source</p>
                  <p className="mt-1 text-white">{viewLead.service || 'Main Website'}</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-gray-400">Created Date</p>
                  <p className="mt-1 text-white">{viewLead.date}</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Notes</h3>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-white whitespace-pre-line">{viewLead.message || '-'}</p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Status</h3>
              <div className="bg-slate-800 rounded-lg p-4">
                <p className="text-white">New</p>
              </div>
            </section>
          </div>
        ) : null}
      </RightDrawer>
    </main>
  );
}