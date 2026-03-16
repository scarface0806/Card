'use client';

import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import DataTable from '@/components/admin/DataTable';
import AdminToast from '@/components/admin/AdminToast';

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

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Main Website Leads</h1>
          <p className="mt-1 text-sm text-gray-400">Leads captured from website service and contact forms.</p>
        </div>
        <button
          type="button"
          onClick={fetchLeads}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/5 bg-[#2a3048] px-4 py-2.5 font-medium text-white transition hover:bg-[#313755]"
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
        onView={(row: LeadRow) => setToast({ variant: 'info', message: `${row.name} (${row.phone}) -> ${row.message}` })}
      />
    </main>
  );
}