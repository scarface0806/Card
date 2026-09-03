'use client';

import { useState, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';

import { useCardBackImage } from '@/hooks/useCardBackImage';
import CardArtwork from '@/components/ui/CardArtwork';

/**
 * CARD FLIP IMAGE — the image area of a card, with a back face behind it.
 *
 * Every surface that shows a purchasable card's artwork goes through this: the
 * homepage catalogue tiles, the /cards tiles, the Quick-view modal and the
 * live preview on /create-card. The flip mechanic therefore exists once rather
 * than four times.
 *
 * WHAT IT DOES NOT DO
 * It does not draw the front. The caller passes its own front face as `front`,
 * exactly as it rendered it before, so adopting this component changes no
 * pixels on the front side. It owns only the box, the back face, the flip and
 * the control.
 *
 * DEGRADES TO NOTHING
 * The back face is only offered once its URL has actually been fetched - see
 * useCardBackImage, which probes it off-DOM rather than waiting for an
 * `onError` from a lazy, rotated-away <img> that the browser may never load.
 * With no back face the markup collapses to the front inside its box, which is
 * byte-for-byte what the caller had before.
 *
 * CONTROLLED OR NOT
 * Left alone it owns its own flip state and draws its own corner control -
 * that is what the catalogue tiles want. Pass `flipped` + `onFlipChange` and
 * it becomes controlled, so a parent (the Quick-view lightbox, with its
 * segmented Front/Back buttons and arrow keys) can drive it; pass
 * `showControl={false}` to suppress the corner button in that case.
 *
 * MOTION
 * A 3D rotateY, 560ms, on the compositor only. Under
 * `prefers-reduced-motion: reduce` the rotation is replaced by a cross-fade —
 * see the `CARD FLIP` block in globals.css.
 */

interface CardFlipImageProps {
  /** Front image URL, i.e. `Product.images[0]`. Used to derive the back. */
  frontSrc?: string | null;
  /** A real back-image field, when one exists. Wins over the convention. */
  backImage?: string | null;
  /** Card name, used to build the back face's alt text and the aria labels. */
  name: string;
  /** The front face, drawn by the caller. */
  front: ReactNode;
  /**
   * Layered above BOTH faces and outside the rotating element, so it does not
   * flip with the card — the tiles' "Quick view" scrim lives here.
   *
   * Give the wrapper `pointer-events-none` and its interactive children
   * `pointer-events-auto`, or it will swallow the click-to-flip underneath it.
   */
  overlay?: ReactNode;
  /** Classes for the box: aspect ratio, radius, background. */
  className?: string;
  /** Inline styles for the box, e.g. a product's own finish as the ground. */
  style?: React.CSSProperties;
  /** Classes for the back <img>. Defaults to filling the box. */
  imageClassName?: string;
  /** Corner the control sits in. Defaults to top-left, clear of the NFC mark. */
  controlClassName?: string;
  /** Controlled flip state. Omit to let the component own it. */
  flipped?: boolean;
  /** Required for controlled use. */
  onFlipChange?: (next: boolean) => void;
  /** Draw the built-in corner control. Off when a parent supplies its own. */
  showControl?: boolean;
}

export default function CardFlipImage({
  frontSrc,
  backImage,
  name,
  front,
  overlay,
  className = '',
  style,
  imageClassName = 'h-full w-full object-cover',
  controlClassName = 'left-3 top-3',
  flipped: flippedProp,
  onFlipChange,
  showControl = true,
}: CardFlipImageProps) {
  // Probed, not guessed: `available` only turns true once the bytes arrive.
  const { backSrc, available } = useCardBackImage(frontSrc, backImage);

  const [uncontrolledFlipped, setUncontrolledFlipped] = useState(false);
  const isControlled = flippedProp !== undefined;
  const flipped = isControlled ? flippedProp : uncontrolledFlipped;

  const setFlipped = (next: boolean) => {
    if (!isControlled) setUncontrolledFlipped(next);
    onFlipChange?.(next);
  };

  // A new product in the same slot is a different card: drop the flip, or a
  // tile could stay turned over onto a back face that is not its own. Adjusted
  // during render rather than in an effect - React re-runs this component
  // immediately, before touching the DOM, so there is no flash of the previous
  // card's back face and no cascading second paint.
  const [renderedFor, setRenderedFor] = useState(backSrc);
  if (renderedFor !== backSrc) {
    setRenderedFor(backSrc);
    if (!isControlled) setUncontrolledFlipped(false);
  }

  const showingBack = available && flipped;

  // No back face: render exactly what the caller would have rendered alone.
  if (!available) {
    return (
      <div className={`relative ${className}`} style={style}>
        {front}
        {overlay}
      </div>
    );
  }

  return (
    <div className={`tv-flip-scene relative ${className}`} style={style}>
      <div className="tv-flip" data-flipped={showingBack}>
        <div
          className="tv-flip-face tv-flip-face-front"
          aria-hidden={showingBack || undefined}
        >
          {front}
        </div>

        <div
          className="tv-flip-face tv-flip-face-back"
          aria-hidden={!showingBack || undefined}
        >
          <CardArtwork
            src={backSrc}
            alt={`${name} NFC card, back`}
            name={name}
            label="Back"
            className={imageClassName}
          />
        </div>
      </div>

      {/*
        Click anywhere on the artwork to flip. Deliberately inert to assistive
        tech and to the keyboard: the labelled control below is the accessible
        path, and exposing this as a second tab stop would announce the same
        action twice. Suppressed alongside the control when a parent owns the
        interaction.
      */}
      {showControl ? (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setFlipped(!flipped)}
          className="absolute inset-0 z-10 cursor-pointer"
        >
          <span className="sr-only">Flip card</span>
        </button>
      ) : null}

      {/* Above the click target, so a scrim can still hold its own buttons. */}
      {overlay}

      {/*
        The discoverable control. Sized and set like the mono labels on the
        card face itself (0.625rem, 600, uppercase, wide tracking) so it reads
        as part of the card rather than as chrome dropped on top of it.
      */}
      {showControl ? (
        <button
          type="button"
          onClick={() => setFlipped(!flipped)}
          aria-pressed={showingBack}
          aria-label={
            showingBack
              ? `Show the front of the ${name} card`
              : `Show the back of the ${name} card`
          }
          className={`tv-focus absolute z-30 inline-flex items-center gap-1.5 rounded-full border border-[#F1F3F1]/40 bg-[#070A09]/72 px-2.5 py-1.5 text-[#F1F3F1] backdrop-blur-[2px] transition-colors duration-200 hover:bg-[#070A09]/88 hover:border-[#F1F3F1]/60 ${controlClassName}`}
          style={{
            fontFamily: 'var(--font-mono), ui-monospace, monospace',
            fontSize: '0.625rem',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          <RotateCw className="h-3 w-3" strokeWidth={1.8} aria-hidden="true" />
          <span aria-hidden="true">{showingBack ? 'View front' : 'View back'}</span>
        </button>
      ) : null}
    </div>
  );
}
