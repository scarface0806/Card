'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface AdminToastProps {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
}

/**
 * The old success variant was built from three class names that do not exist
 * in Tailwind v4 — they were declared only in tailwind.config.ts, which v4
 * never loads — and one of them carried a doubled opacity suffix that was
 * never valid in any version. A success toast therefore rendered with no
 * border, no background and inherited text. All three variants now resolve to
 * real tones from the site palette.
 */
const styleMap: Record<ToastVariant, string> = {
  success: 'tv-adm-alert--patina',
  error: 'tv-adm-alert--danger',
  info: 'tv-adm-alert--brass',
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') {
    return <CheckCircle2 className="tv-adm-alert-icon h-4 w-4 flex-shrink-0" />;
  }
  if (variant === 'error') {
    return <AlertTriangle className="tv-adm-alert-icon h-4 w-4 flex-shrink-0" />;
  }
  return <Info className="tv-adm-alert-icon h-4 w-4 flex-shrink-0" />;
}

export default function AdminToast({ message, variant = 'info', onClose }: AdminToastProps) {
  return (
    <div
      className={`tv-adm-alert flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between ${styleMap[variant]}`}
    >
      <div className="flex items-start gap-3">
        <ToastIcon variant={variant} />
        <p>{message}</p>
      </div>
      {onClose && (
        <button type="button" onClick={onClose} className="tv-adm-action flex-shrink-0">
          Dismiss
        </button>
      )}
    </div>
  );
}
