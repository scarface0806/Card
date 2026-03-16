'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { RotateCw, Send } from 'lucide-react';

interface SubscriberRow {
  id: string;
  sno: number;
  email: string;
  name: string;
  source: string;
  date: string;
  status: 'active' | 'inactive';
}

export default function NewslettersPage() {
  const [data, setData] = useState<SubscriberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<SubscriberRow | null>(null);
  const [campaign, setCampaign] = useState({
    subject: '',
    previewText: '',
    content: '',
  });

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/subscribers?limit=200', {
        credentials: 'include',
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to fetch subscribers');
      }

      const payload = await response.json();
      const mapped: SubscriberRow[] = (payload.subscribers || []).map((subscriber: any, index: number) => ({
        id: subscriber.id,
        sno: index + 1,
        email: subscriber.email,
        name: subscriber.name || '-',
        source: subscriber.source || 'website',
        date: new Date(subscriber.createdAt).toLocaleDateString(),
        status: subscriber.isActive ? 'active' : 'inactive',
      }));

      setData(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscribers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscribers();
  }, [fetchSubscribers]);

  const handleRefresh = () => {
    fetchSubscribers();
  };

  const handleSendCampaign = async () => {
    if (!campaign.subject.trim() || !campaign.content.trim()) {
      setError('Subject and campaign content are required');
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/newsletters/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          subject: campaign.subject.trim(),
          content: campaign.content,
          previewText: campaign.previewText.trim() || campaign.subject.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to send campaign');
      }

      setSuccess(payload.message || 'Campaign sent successfully');
      setCampaign({ subject: '', previewText: '', content: '' });
      setShowComposer(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send campaign');
    } finally {
      setSending(false);
    }
  };

  const handleView = (row: SubscriberRow) => {
    setSuccess(`Subscriber: ${row.email} (${row.source})`);
  };

  const handleDelete = async (row: SubscriberRow) => {
    setPendingDelete(row);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;

    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/admin/subscribers?id=${encodeURIComponent(pendingDelete.id)}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Failed to remove subscriber');
      }

      setData((prev) => prev.filter((item) => item.id !== pendingDelete.id));
      setSuccess(`Removed subscriber ${pendingDelete.email}`);
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove subscriber');
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Newsletters</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your email subscriber list and newsletter campaigns</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <button
            onClick={() => {
              setShowComposer((prev) => !prev);
              setPendingDelete(null);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/10"
          >
            <Send className="w-4 h-4 text-orange-400" />
            {showComposer ? 'Close Composer' : 'Send Campaign'}
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

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300">
          {success}
        </div>
      )}

      {showComposer && (
        <div className="rounded-2xl border border-white/10 bg-[#1b2030] p-4 sm:p-5 space-y-4">
          <h2 className="text-white text-lg font-medium">Compose Campaign</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Subject</label>
              <input
                type="text"
                value={campaign.subject}
                onChange={(e) => setCampaign((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Monthly updates from Tapvyo"
                className="w-full rounded-xl bg-[#262b40] border border-white/10 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Preview Text (Optional)</label>
              <input
                type="text"
                value={campaign.previewText}
                onChange={(e) => setCampaign((prev) => ({ ...prev, previewText: e.target.value }))}
                placeholder="New features, offers, and product highlights"
                className="w-full rounded-xl bg-[#262b40] border border-white/10 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-300">HTML Content</label>
            <textarea
              value={campaign.content}
              onChange={(e) => setCampaign((prev) => ({ ...prev, content: e.target.value }))}
              rows={7}
              placeholder="<h1>Hello from Tapvyo</h1><p>Your campaign content goes here.</p>"
              className="w-full rounded-xl bg-[#262b40] border border-white/10 px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSendCampaign}
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-medium disabled:opacity-60"
            >
              {sending ? 'Sending...' : 'Send Campaign'}
            </button>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-amber-200">
            Remove subscriber <span className="font-medium">{pendingDelete.email}</span> from the newsletter list?
          </p>
          <div className="flex w-full md:w-auto items-center gap-2">
            <button
              onClick={() => setPendingDelete(null)}
              className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-white/5 text-gray-200 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-400"
            >
              Confirm Remove
            </button>
          </div>
        </div>
      )}

      <DataTable
        columns={[
          { key: 'sno', label: 'S.NO', width: '60px' },
          { key: 'email', label: 'Email Address' },
          { key: 'name', label: 'Name' },
          { key: 'source', label: 'Source' },
          { key: 'date', label: 'Subscribed On' },
          {
            key: 'status',
            label: 'Status',
            render: (status) => (
              <StatusBadge status={status === 'inactive' ? 'inactive' : status as any} />
            ),
          },
        ]}
        data={loading ? [] : data}
        onView={handleView}
        onDelete={handleDelete}
      />
    </main>
  );
}
