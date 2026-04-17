'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import { Plus, RefreshCw } from 'lucide-react';

interface CardRow {
  id: string;
  sno: number;
  name: string;
  owner: string;
  type: string;
  status: 'active' | 'inactive' | 'pending';
  createdDate: string;
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

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/cards?limit=200', {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch cards');
      }

      const data = await response.json();
      const mapped: CardRow[] = (data.cards || []).map((card: any, index: number) => {
        const ownerName = card.user?.name || card.user?.email || 'Unassigned';
        const detailsName = [card.details?.firstName, card.details?.lastName].filter(Boolean).join(' ');
        return {
          id: card.id,
          sno: index + 1,
          name: detailsName || card.slug,
          owner: ownerName,
          type: card.cardType || 'standard',
          status: mapCardStatus(card.status),
          createdDate: new Date(card.createdAt).toLocaleDateString(),
        };
      });

      setCards(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleEdit = async (row: CardRow) => {
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

  const confirmDisableCard = async () => {
    if (!confirmTarget) return;

    try {
      setConfirmLoading(true);
      const response = await fetch(`/api/admin/cards/${confirmTarget.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'INACTIVE' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disable card');
      }

      await fetchCards();
      setToast({ variant: 'success', message: `Card ${confirmTarget.name} disabled successfully` });
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
          <h1 className="text-2xl font-semibold text-white">Cards</h1>
          <p className="text-gray-400 text-sm mt-1">Manage and customize NFC card products and designs</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <button
            onClick={fetchCards}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/10"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => window.location.assign('/admin/customers/create')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-[#0f2e25] px-4 py-2.5 rounded-xl hover:from-[#28A428] hover:to-[#e6e600] hover:shadow-lg transition-all font-medium active:scale-95"
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
        title="Disable card"
        description={confirmTarget ? `Mark ${confirmTarget.name} as inactive?` : ''}
        confirmText="Disable Card"
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmDisableCard}
        loading={confirmLoading}
        tone="danger"
      />

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'name', label: 'Card Name' },
          { key: 'owner', label: 'Owner' },
          { key: 'type', label: 'Card Type', width: '120px' },
          { key: 'createdDate', label: 'Created', width: '120px' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => <StatusBadge status={status as any} />,
          },
        ]}
        data={loading ? [] : cards}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </main>
  );
}
