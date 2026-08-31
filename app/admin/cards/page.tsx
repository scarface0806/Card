'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import { ExternalLink, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { isAbortError } from '@/lib/fetch-utils';

interface CardRow {
  id: string;
  sno: number;
  name: string;
  owner: string;
  type: string;
  status: 'active' | 'inactive' | 'pending';
  createdDate: string;
  nfcLink: string;
  title: string;
  company: string;
}

interface ToastState {
  variant: 'success' | 'error' | 'info';
  message: string;
}

function mapCardStatus(status: string): 'active' | 'inactive' | 'pending' {
  const normalized = status?.toUpperCase();
  if (normalized === 'ACTIVE') return 'active';
  if (normalized === 'PENDING') return 'pending';
  return 'inactive';
}

export default function CardsPage() {
  const [cards, setCards] = useState<CardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<CardRow | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [editTarget, setEditTarget] = useState<CardRow | null>(null);
  const [editDetails, setEditDetails] = useState({
    firstName: '',
    lastName: '',
    title: '',
    company: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  const fetchCards = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/cards?limit=200', {
        credentials: 'include',
        signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch cards');
      }

      const data = await response.json();
      if (signal?.aborted) return;
      const mapped: CardRow[] = (data.cards || []).map((card: any, index: number) => {
        const ownerName = card.user?.name || card.user?.email || 'Unassigned';
        const detailsName = [card.details?.firstName, card.details?.lastName].filter(Boolean).join(' ');
        return {
          id: card.id,
          sno: index + 1,
          name: detailsName || card.user?.name || card.slug,
          owner: ownerName,
          type: card.cardType || 'standard',
          status: mapCardStatus(card.status),
          createdDate: new Date(card.createdAt).toLocaleDateString(),
          nfcLink: `${window.location.origin}/card/${card.slug}`,
          title: card.details?.title || '',
          company: card.details?.company || '',
        };
      });

      setCards(mapped);
    } catch (err) {
      if (signal?.aborted || isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchCards(controller.signal);

    return () => controller.abort();
  }, [fetchCards]);

  const handleEdit = (row: CardRow) => {
    setEditTarget(row);
    setEditDetails({
      firstName: row.name.split(' ')[0] || '',
      lastName: row.name.split(' ').slice(1).join(' '),
      title: row.title,
      company: row.company,
    });
  };

  const saveEdit = async () => {
    if (!editTarget) return;

    try {
      setEditLoading(true);
      const response = await fetch(`/api/admin/cards/${editTarget.id}/detail`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ details: editDetails }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to edit card');
      }

      await fetchCards();
      setEditTarget(null);
      setToast({ variant: 'success', message: 'Card updated successfully' });
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to edit card' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleStatus = async (row: CardRow) => {
    const nextStatus = row.status === 'active' ? 'INACTIVE' : 'ACTIVE';
    try {
      const response = await fetch(`/api/admin/cards/${row.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update card status');
      }

      await fetchCards();
      setToast({ variant: 'success', message: `Card ${row.name} moved to ${nextStatus.toLowerCase()}` });
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to update card status' });
    }
  };

  const handleDelete = (row: CardRow) => {
    setConfirmTarget(row);
  };

  const confirmDeleteCard = async () => {
    if (!confirmTarget) return;

    try {
      setConfirmLoading(true);
      const response = await fetch(`/api/admin/cards/${confirmTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete card');
      }

      await fetchCards();
      setToast({ variant: 'success', message: `Card ${confirmTarget.name} deleted successfully` });
      setConfirmTarget(null);
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to disable card' });
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="tv-adm-page-title">Cards</h1>
          <p className="text-[var(--tv-text-muted)] text-sm mt-1">Manage and customize NFC card products and designs</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <button
            onClick={() => fetchCards()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--tv-slate)] hover:bg-[rgba(241,243,241,0.09)] text-[var(--tv-text)] px-4 py-2.5 rounded-xl transition-all font-medium border border-[var(--tv-rule)]"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => window.location.assign('/admin/customers/create')}
            className="tv-btn tv-btn-gilded w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 ml-[-5px]" />
            Add New Card
          </button>
        </div>
      </div>

      {error && <AdminToast variant="error" message={error} onClose={() => setError(null)} />}
      {toast && <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}

      <AdminConfirmPanel
        open={!!confirmTarget}
        title="Delete card"
        description={confirmTarget ? `Delete ${confirmTarget.name}? This action cannot be undone.` : ''}
        confirmText="Delete Card"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmDeleteCard}
        loading={confirmLoading}
        tone="danger"
      />

      {editTarget && (
        <section className="rounded-2xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="tv-adm-panel-title">Edit Card</h2>
              <p className="mt-1 text-sm text-[var(--tv-text-muted)]">Update the profile details shown on the NFC card.</p>
            </div>
            <button type="button" onClick={() => setEditTarget(null)} className="text-sm text-[var(--tv-text-muted)] hover:text-[var(--tv-text)]">
              Cancel
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {(['firstName', 'lastName', 'title', 'company'] as const).map((field) => (
              <label key={field} className="space-y-2 text-sm font-medium text-[var(--tv-text)]">
                {field === 'title' ? 'Title' : field === 'firstName' ? 'First name' : field === 'lastName' ? 'Last name' : 'Company'}
                <input
                  value={editDetails[field]}
                  onChange={(event) => setEditDetails((current) => ({ ...current, [field]: event.target.value }))}
                  className="w-full rounded-xl border border-[var(--tv-rule)] bg-[rgba(7,10,9,0.55)] px-4 py-2.5 text-[var(--tv-text)] outline-none focus:border-[rgba(76,174,137,0.50)] focus:ring-1 focus:ring-[rgba(76,174,137,0.30)]"
                />
              </label>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button type="button" onClick={saveEdit} disabled={editLoading} className="tv-btn tv-btn-gilded disabled:opacity-50">
              <Pencil className="h-4 w-4" />
              {editLoading ? 'Saving...' : 'Save Card'}
            </button>
          </div>
        </section>
      )}

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'name', label: 'Card Name' },
          { key: 'owner', label: 'Owner' },
          { key: 'type', label: 'Card Type', width: '120px' },
          { key: 'createdDate', label: 'Created', width: '120px' },
          {
            key: 'nfcLink',
            label: 'NFC Link',
            render: (value: string) => (
              <a href={value} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--tv-patina)] hover:text-[var(--tv-patina)]" title={value}>
                Open <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ),
          },
          {
            key: 'status',
            label: 'Status',
            render: (status) => <StatusBadge status={status as any} />,
          },
        ]}
        data={loading ? [] : cards}
        onEdit={handleEdit}
        onDelete={handleDelete}
        extraActions={[
          {
            key: 'toggle-status',
            label: (row: CardRow) => (row.status === 'active' ? 'Deactivate' : 'Activate'),
            onClick: handleToggleStatus,
            tone: 'warning',
          },
        ]}
      />
    </main>
  );
}
