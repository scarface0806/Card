'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import { RotateCw, Send } from 'lucide-react';
import { isAbortError } from '@/lib/fetch-utils';

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

  const fetchSubscribers = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/admin/subscribers?limit=200', {
        credentials: 'include',
        signal,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to fetch subscribers');
      }

      const payload = await response.json();
      if (signal?.aborted) return;
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
      if (signal?.aborted || isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch subscribers');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchSubscribers(controller.signal);

    return () => controller.abort();
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
          <h1 className="tv-adm-page-title">Newsletters</h1>
          <p className="text-[var(--tv-text-muted)] text-sm mt-1">Manage your email subscriber list and newsletter campaigns</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <button
            onClick={() => {
              setShowComposer((prev) => !prev);
              setPendingDelete(null);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--tv-slate)] hover:bg-[rgba(241,243,241,0.09)] text-[var(--tv-text)] px-4 py-2.5 rounded-xl transition-all font-medium border border-[var(--tv-rule)]"
          >
            <Send className="w-4 h-4 text-[var(--tv-patina)]" />
            {showComposer ? 'Close Composer' : 'Send Campaign'}
          </button>
          <button
            onClick={handleRefresh}
            className="tv-btn tv-btn-gilded w-full sm:w-auto"
          >
            <RotateCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[rgba(224,122,110,0.30)] bg-[rgba(224,122,110,0.10)] p-4 text-sm text-[var(--tv-danger)]">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-[rgba(201,169,97,0.32)] bg-[rgba(76,174,137,0.10)] p-4 text-sm text-[var(--tv-patina)]">
          {success}
        </div>
      )}

      {showComposer && (
        <div className="rounded-2xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] p-4 sm:p-5 space-y-4">
          <h2 className="tv-adm-panel-title">Compose Campaign</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm text-[var(--tv-text)]">Subject</label>
              <input
                type="text"
                value={campaign.subject}
                onChange={(e) => setCampaign((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Monthly updates from Tapvyo"
                className="w-full rounded-xl bg-[var(--tv-slate)] border border-[var(--tv-rule)] px-4 py-2.5 text-[var(--tv-text)] placeholder-[rgba(169,181,176,0.7)] focus:outline-none focus:border-[rgba(76,174,137,0.50)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-[var(--tv-text)]">Preview Text (Optional)</label>
              <input
                type="text"
                value={campaign.previewText}
                onChange={(e) => setCampaign((prev) => ({ ...prev, previewText: e.target.value }))}
                placeholder="New features, offers, and product highlights"
                className="w-full rounded-xl bg-[var(--tv-slate)] border border-[var(--tv-rule)] px-4 py-2.5 text-[var(--tv-text)] placeholder-[rgba(169,181,176,0.7)] focus:outline-none focus:border-[rgba(76,174,137,0.50)]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[var(--tv-text)]">HTML Content</label>
            <textarea
              value={campaign.content}
              onChange={(e) => setCampaign((prev) => ({ ...prev, content: e.target.value }))}
              rows={7}
              placeholder="<h1>Hello from Tapvyo</h1><p>Your campaign content goes here.</p>"
              className="w-full rounded-xl bg-[var(--tv-slate)] border border-[var(--tv-rule)] px-4 py-2.5 text-[var(--tv-text)] placeholder-[rgba(169,181,176,0.7)] focus:outline-none focus:border-[rgba(76,174,137,0.50)]"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleSendCampaign}
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-[var(--tv-brass)] text-[var(--tv-ink)] font-medium disabled:opacity-60 hover:from-[var(--tv-brass)] hover:to-[var(--tv-brass)] transition-all"
            >
              {sending ? 'Sending...' : 'Send Campaign'}
            </button>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div className="rounded-2xl border border-[rgba(201,169,97,0.30)] bg-[rgba(201,169,97,0.10)] p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm text-[var(--tv-brass)]">
            Remove subscriber <span className="font-medium">{pendingDelete.email}</span> from the newsletter list?
          </p>
          <div className="flex w-full md:w-auto items-center gap-2">
            <button
              onClick={() => setPendingDelete(null)}
              className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-[rgba(241,243,241,0.06)] text-[var(--tv-text)] hover:bg-[rgba(241,243,241,0.06)]"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-[var(--tv-danger)] text-[var(--tv-text)] hover:bg-[var(--tv-danger)]"
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
