'use client';

import { useState, type ReactNode } from 'react';
import { RotateCw } from 'lucide-react';

import { resolveCardBackImage } from '@/lib/cardImages';

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
 * When there is no derivable back image, or the back image 404s, the control
 * is not rendered and the markup collapses to the front face inside its box —
 * byte-for-byte what the caller had before. There is deliberately no grey
 * placeholder and no broken <img>: a card with no back simply has no back.
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
}: CardFlipImageProps) {
  const backSrc = resolveCardBackImage(frontSrc, backImage);

  const [flipped, setFlipped] = useState(false);
  // Set when the derived URL turns out not to exist. Once true the control and
  // the back face are gone for good, for this URL.
  const [backFailed, setBackFailed] = useState(false);

  // A new product in the same slot is a different card: drop both bits of
  // state, or a tile could stay flipped onto a back face that is not its own,
  // and one card's 404 would suppress the control on the card that replaced
  // it. Adjusted during render rather than in an effect - React re-runs this
  // component immediately, before touching the DOM, so there is no flash of
  // the previous card's back face and no cascading second paint.
  const [renderedFor, setRenderedFor] = useState(backSrc);
  if (renderedFor !== backSrc) {
    setRenderedFor(backSrc);
    setFlipped(false);
    setBackFailed(false);
  }

  const hasBack = Boolean(backSrc) && !backFailed;
  const showingBack = hasBack && flipped;

  // No back face: render exactly what the caller would have rendered alone.
  if (!hasBack) {
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
          <img
            src={backSrc ?? undefined}
            alt={`${name} NFC card, back`}
            loading="lazy"
            className={imageClassName}
            // The derived URL is a guess until the browser proves otherwise.
            // A miss retires the whole feature for this card rather than
            // leaving a broken image behind the front face.
            onError={() => {
              setBackFailed(true);
              setFlipped(false);
            }}
          />
        </div>
      </div>

      {/*
        Click anywhere on the artwork to flip. Deliberately inert to assistive
        tech and to the keyboard: the labelled control below is the accessible
        path, and exposing this as a second tab stop would announce the same
        action twice.
      */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={() => setFlipped((current) => !current)}
        className="absolute inset-0 z-10 cursor-pointer"
      >
        <span className="sr-only">Flip card</span>
      </button>

      {/* Above the click target, so a scrim can still hold its own buttons. */}
      {overlay}

      {/*
        The discoverable control. Sized and set like the mono labels on the
        card face itself (0.625rem, 600, uppercase, wide tracking) so it reads
        as part of the card rather than as chrome dropped on top of it.
      */}
      <button
        type="button"
        onClick={() => setFlipped((current) => !current)}
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
    </div>
  );
}
