'use client';

import React from 'react';
import { X } from 'lucide-react';

interface AdminConfirmPanelProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  tone?: 'danger' | 'warning';
}

export default function AdminConfirmPanel({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  tone = 'warning',
}: AdminConfirmPanelProps) {
  if (!open) return null;

  const panelTone =
    tone === 'danger'
      ? 'border-red-500/30 bg-red-500/10 text-red-100'
      : 'border-amber-500/30 bg-amber-500/10 text-amber-100';

  const confirmTone = tone === 'danger' ? 'bg-red-500 hover:bg-red-400' : 'bg-amber-500 hover:bg-amber-400';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-[2px] p-3 sm:p-6" onClick={onCancel}>
      <div className="min-h-full flex items-center justify-center">
        <div
          className={`w-full max-w-lg rounded-2xl border p-4 sm:p-5 ${panelTone}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-sm opacity-90">{description}</p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg p-1.5 text-current/70 hover:bg-white/10 hover:text-current"
              aria-label="Close confirmation dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4 flex w-full items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 px-4 py-2 rounded-xl text-white disabled:opacity-60 ${confirmTone}`}
            >
              {loading ? 'Working...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
