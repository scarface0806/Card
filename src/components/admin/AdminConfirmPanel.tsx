'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

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

  // The tone colours the mark and the confirm button only. The panel itself
  // stays the standard dialog surface — a whole sheet washed in red or amber
  // made the body copy hard to read and shouted before the user had read what
  // they were confirming.
  const isDanger = tone === 'danger';

  return (
    <div className="tv-adm-scrim z-50 overflow-y-auto p-3 sm:p-6" onClick={onCancel}>
      <div className="flex min-h-full items-center justify-center">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="tv-adm-confirm-title"
          className="tv-adm-dialog max-w-lg"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="tv-adm-dialog-head">
            <div className="flex items-start gap-3">
              <span
                className={`tv-adm-stat-icon ${
                  isDanger ? 'tv-adm-stat-icon--danger' : 'tv-adm-stat-icon--brass'
                }`}
              >
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <h3 id="tv-adm-confirm-title" className="tv-adm-dialog-title">
                  {title}
                </h3>
                <p className="tv-adm-page-sub mt-1">{description}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onCancel}
              className="tv-adm-iconbtn !p-1.5 flex-shrink-0"
              aria-label="Close confirmation dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="tv-adm-dialog-foot">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="tv-btn tv-btn-secondary flex-1 !min-h-[42px] !text-sm disabled:opacity-60"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="tv-btn flex-1 !min-h-[42px] !text-sm disabled:opacity-60"
              style={{
                background: isDanger ? 'var(--tv-danger)' : 'var(--tv-brass)',
                color: 'var(--tv-ink)',
              }}
            >
              {loading ? 'Working...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
