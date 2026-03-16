'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

type ToastVariant = 'success' | 'error' | 'info';

interface AdminToastProps {
  message: string;
  variant?: ToastVariant;
  onClose?: () => void;
}

const styleMap: Record<ToastVariant, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
};

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') {
    return <CheckCircle2 className="w-4 h-4" />;
  }
  if (variant === 'error') {
    return <AlertTriangle className="w-4 h-4" />;
  }
  return <Info className="w-4 h-4" />;
}

export default function AdminToast({ message, variant = 'info', onClose }: AdminToastProps) {
  return (
    <div className={`rounded-xl border p-4 text-sm flex items-start justify-between gap-3 ${styleMap[variant]}`}>
      <div className="flex items-start gap-2">
        <ToastIcon variant={variant} />
        <p>{message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-xs px-2 py-1 rounded-md bg-black/20 hover:bg-black/30 transition-colors"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
