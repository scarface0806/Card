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
      <div className="tv-adm-scrim !static flex-1" onClick={onClose} />

      {/* The panel is the site graphite surface with a hairline edge, and it
          slides on transform alone so the whole sheet composites. */}
      <div
        className={`${widthClassName} h-full max-h-screen overflow-y-auto border-l border-[var(--tv-rule)] bg-[var(--tv-graphite)] text-[var(--tv-text)] shadow-[-24px_0_60px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
