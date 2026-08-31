'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import AdminToast from '@/components/admin/AdminToast';
import RightDrawer from '@/components/ui/RightDrawer';
import { isAbortError } from '@/lib/fetch-utils';

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

  const fetchLeads = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/leads?type=main&limit=200', {
        credentials: 'include',
        signal,
      });
      const payload = await response.json();
      if (signal?.aborted) return;

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
      if (signal?.aborted || isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch leads');
    } finally {
      if (!signal?.aborted) setLoading(false);
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
    const controller = new AbortController();
    fetchLeads(controller.signal);

    return () => controller.abort();
  }, [fetchLeads]);

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="tv-adm-page-title">Main Website Leads</h1>
          <p className="mt-1 text-sm text-[var(--tv-text-muted)]">Leads captured from website service and contact forms.</p>
        </div>
        <button
          type="button"
          onClick={() => fetchLeads()}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-slate)] px-4 py-2.5 font-medium text-[var(--tv-text)] transition hover:bg-[rgba(241,243,241,0.09)]"
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
            render: (value: string) => <span className="line-clamp-2 max-w-[320px] text-[var(--tv-text)]">{value}</span>,
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
            <div className="flex items-center justify-between border-b border-[var(--tv-rule)] pb-4">
              <div>
                <h2 className="tv-adm-panel-title">{viewLead.name || 'Lead Details'}</h2>
                <p className="text-sm text-[var(--tv-text-muted)] mt-1">Lead ID: {viewLead.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewLead(null)}
                className="text-[var(--tv-text-muted)] hover:text-[var(--tv-text)]"
                aria-label="Close lead details"
              >
                ✕
              </button>
            </div>

            <section className="space-y-3">
              <h3 className="tv-adm-label">Lead Info</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Name</p>
                  <p className="mt-1 text-[var(--tv-text)]">{viewLead.name}</p>
                </div>
                <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Email</p>
                  <p className="mt-1 text-[var(--tv-text)] break-all">{viewLead.email}</p>
                </div>
                <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Phone</p>
                  <p className="mt-1 text-[var(--tv-text)]">{viewLead.phone}</p>
                </div>
                <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Company</p>
                  <p className="mt-1 text-[var(--tv-text)]">-</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="tv-adm-label">Lead Source</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Campaign</p>
                  <p className="mt-1 text-[var(--tv-text)]">-</p>
                </div>
                <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                  <p className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Source</p>
                  <p className="mt-1 text-[var(--tv-text)]">{viewLead.service || 'Main Website'}</p>
                </div>
                <div className="bg-[var(--tv-slate)] rounded-lg p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Created Date</p>
                  <p className="mt-1 text-[var(--tv-text)]">{viewLead.date}</p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="tv-adm-label">Notes</h3>
              <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                <p className="text-[var(--tv-text)] whitespace-pre-line">{viewLead.message || '-'}</p>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="tv-adm-label">Status</h3>
              <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                <p className="text-[var(--tv-text)]">New</p>
              </div>
            </section>
          </div>
        ) : null}
      </RightDrawer>
    </main>
  );
}