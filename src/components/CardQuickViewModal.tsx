'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { X } from 'lucide-react';

import CardFlipImage from '@/components/ui/CardFlipImage';
import CardArtwork from '@/components/ui/CardArtwork';
import { useCardBackImage } from '@/hooks/useCardBackImage';
import {
  cardAspectClass,
  normalizeOrientation,
  type CardOrientation,
} from '@/lib/products/orientation';

/**
 * QUICK VIEW — the card, large, front and back.
 *
 * The checkout rail's preview is 320px wide and now carries no typed details,
 * so this is where a customer actually inspects what they are buying.
 *
 * It reuses <CardFlipImage> in CONTROLLED mode rather than reimplementing the
 * turn: the segmented Front/Back buttons and the arrow keys drive `flipped`,
 * and the component's own corner control is suppressed. There is exactly one
 * 3D flip implementation in this codebase and this is not a second one.
 *
 * The Back segment is only rendered when useCardBackImage has actually
 * fetched the back URL, so a card with no back face shows a single unlabelled
 * image and no dead toggle.
 *
 * DIALOG BEHAVIOUR
 * Escape, backdrop click and a visible close button all dismiss. Focus is
 * trapped while open and restored to whatever opened it. Body scroll is locked.
 * The project has no dialog primitive with these behaviours - Modal.tsx is on
 * the legacy palette and has none of them - so they are implemented here.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface CardQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  frontSrc?: string | null;
  backImage?: string | null;
  /** Gradient drawn behind the artwork, as on the card itself. */
  color?: string;
  /** Mono line above the title, e.g. the tier label. */
  eyebrow?: string;
  /** Formatted price, shown under the title when given. */
  price?: string;
  /** Card shape. Absent is read as horizontal. */
  orientation?: CardOrientation;
}

export default function CardQuickViewModal({
  isOpen,
  onClose,
  name,
  frontSrc,
  backImage,
  color,
  eyebrow,
  price,
  orientation,
}: CardQuickViewModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const [flipped, setFlipped] = useState(false);
  const reduceMotion = useReducedMotion();

  const { available: hasBack } = useCardBackImage(frontSrc, backImage);

  // Always open on the front, whichever face was last shown.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    if (isOpen) setFlipped(false);
  }

  // A back face that turns out not to exist must not leave the card stranded
  // on a blank reverse.
  if (flipped && !hasBack) setFlipped(false);

  // Remember the opener so focus can go home, and lock body scroll.
  useEffect(() => {
    if (!isOpen) return;

    openerRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog once it exists.
    const frame = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panelRef.current)?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previousOverflow;
      openerRef.current?.focus?.();
    };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key === 'ArrowRight' && hasBack) {
        setFlipped(true);
        return;
      }

      if (event.key === 'ArrowLeft') {
        setFlipped(false);
        return;
      }

      if (event.key !== 'Tab') return;

      // Focus trap. The dialog is portalled to <body>, so without this Tab
      // walks straight out into the page behind the backdrop.
      const focusable = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [hasBack, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // createPortal needs a real document. Guarding on its existence rather than
  // on a mounted flag keeps this out of an effect: `isOpen` is always false on
  // first client render, so both the server and the hydrating client produce
  // nothing and there is no mismatch to reconcile.
  if (typeof document === 'undefined') return null;

  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, scale: 0.96, y: 16 },
        animate: { opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0, scale: 0.96, y: 16 },
      };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="tv-modal-backdrop z-[60]"
          />

          <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
            <motion.div
              {...panelMotion}
              transition={{ duration: reduceMotion ? 0.15 : 0.28, ease: 'easeOut' }}
              className="tv-modal-panel my-auto w-full max-w-lg"
            >
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className="outline-none"
              >
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close quick view"
                  className="tv-modal-close z-10"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>

                <div className="tv-modal-body">
                  {/* The card, as large as the panel allows. `aspect-[1.6/1]`
                      and a max width keep it inside a small viewport without
                      any horizontal scroll. */}
                  <div
                    className="mx-auto mb-6 w-full max-w-sm overflow-hidden rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.5)]"
                    style={color ? { background: color } : undefined}
                  >
                    <CardFlipImage
                      frontSrc={frontSrc}
                      backImage={backImage}
                      name={name}
                      className={cardAspectClass(normalizeOrientation(orientation))}
                      flipped={flipped}
                      onFlipChange={setFlipped}
                      showControl={false}
                      front={
                        <CardArtwork
                          src={frontSrc}
                          alt={`${name} NFC card, front`}
                          name={name}
                          label="Front"
                        />
                      }
                    />
                  </div>

                  {/* Front / Back. Only offered when there is a back face that
                      has actually loaded. 44px min target on both. */}
                  {hasBack ? (
                    <div
                      className="tv-seg mx-auto mb-6"
                      role="group"
                      aria-label="Choose which side of the card to view"
                    >
                      <button
                        type="button"
                        onClick={() => setFlipped(false)}
                        aria-pressed={!flipped}
                        className="tv-seg-btn"
                      >
                        Front
                      </button>
                      <button
                        type="button"
                        onClick={() => setFlipped(true)}
                        aria-pressed={flipped}
                        className="tv-seg-btn"
                      >
                        Back
                      </button>
                    </div>
                  ) : null}

                  <div className="text-center">
                    {eyebrow ? <p className="tv-mono mb-2">{eyebrow}</p> : null}

                    <h2 id={titleId} className="tv-h3 mb-3">
                      {name}
                    </h2>

                    {price ? (
                      <p
                        className="text-2xl font-semibold text-[#F1F3F1]"
                        style={{
                          fontFamily: 'var(--font-mono), ui-monospace, monospace',
                        }}
                      >
                        {price}
                      </p>
                    ) : null}

                    {hasBack ? (
                      <p className="tv-small mt-4">
                        Use the arrow keys to turn the card over.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
