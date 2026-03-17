'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
}

export default function RightDrawer({
  open,
  onClose,
  children,
  widthClassName = 'w-[720px] max-w-full',
}: RightDrawerProps) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        cancelAnimationFrame(frame);
        document.body.style.overflow = previousOverflow;
      };
    }

    setVisible(false);
    const timeout = setTimeout(() => setRendered(false), 300);
    return () => clearTimeout(timeout);
  }, [open]);

  if (!rendered || typeof window === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`${widthClassName} h-full max-h-screen bg-slate-900 border-l border-slate-700 shadow-2xl overflow-y-auto transition-transform duration-300 ease-in-out ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
