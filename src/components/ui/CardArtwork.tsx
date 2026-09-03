'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ImageOff } from 'lucide-react';

/**
 * CARD ARTWORK — one <img> for a card face, and one honest failure state.
 *
 * WHY THIS EXISTS
 *
 * Every surface used to render `card.images[0]` as a bare <img> with no error
 * handling. When that URL 404s - a Cloudinary asset that was cleaned up, or a
 * path like /cards/elegant.png for a file that was never added to /public -
 * the browser renders nothing and the card's `color` gradient shows through.
 * The result is an empty grey box with no explanation, which is the reported
 * bug. There is no amount of URL-guessing that fixes that; the fix is to
 * notice the failure and say so.
 *
 * The fallback is deliberately the card's NAME on the panel's own ground,
 * set in the same mono treatment as the name plate on the drawn card face -
 * never a grey placeholder rectangle, and never an empty box.
 */

interface CardArtworkProps {
  src?: string | null;
  /** Alt text for the real image. The fallback is labelled from `name`. */
  alt: string;
  /** Card name, shown when the artwork cannot be loaded. */
  name: string;
  /** Optional second line on the fallback, e.g. the material or tier. */
  label?: string;
  className?: string;
  /** Render through next/image. Off by default - most callers use plain img. */
  optimized?: boolean;
  sizes?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
  /** Told when the artwork turns out not to load. */
  onUnavailable?: () => void;
}

export default function CardArtwork({
  src,
  alt,
  name,
  label,
  className = 'h-full w-full object-cover',
  optimized = false,
  sizes,
  priority,
  loading,
  width,
  height,
  onUnavailable,
}: CardArtworkProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const usable = src?.trim() || null;
  const broken = !usable || failedSrc === usable;

  const handleError = () => {
    if (usable) setFailedSrc(usable);
    onUnavailable?.();
  };

  if (broken) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center"
        role="img"
        aria-label={`${name} card artwork unavailable`}
      >
        <ImageOff
          className="h-5 w-5 text-[#F1F3F1]/45"
          strokeWidth={1.6}
          aria-hidden="true"
        />
        <p
          className="max-w-full truncate text-[#F1F3F1]/85"
          style={{
            fontFamily: 'var(--font-mono), ui-monospace, monospace',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}
        >
          {name}
        </p>
        {label ? (
          <p
            className="max-w-full truncate text-[#F1F3F1]/55"
            style={{
              fontFamily: 'var(--font-mono), ui-monospace, monospace',
              fontSize: '0.625rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </p>
        ) : null}
      </div>
    );
  }

  if (optimized) {
    return (
      <Image
        src={usable}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
        onError={handleError}
      />
    );
  }

  return (
    // A plain <img>, matching every other card surface in the project. Callers
    // that want next/image pass `optimized`.
    <img
      src={usable}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      className={className}
      onError={handleError}
    />
  );
}
