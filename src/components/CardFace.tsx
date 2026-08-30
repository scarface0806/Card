'use client';

/**
 * CARD FACE — a drawn NFC card, used wherever a card design has no photograph.
 *
 * Every design in the catalogue carries a `color` (a CSS gradient describing
 * its finish) but only the Quick-view modal ever used it, so a design without
 * an uploaded photo rendered as `/placeholder.svg`: a grey rectangle. Six of
 * those in a row is what the catalogue looked like on first paint, since the
 * fallback designs the page seeds with have no images at all.
 *
 * This draws the finish instead — the gradient, an NFC mark, the design name
 * and its tier — so an image-less design still reads as a physical card.
 * A real photograph always wins; this is only the fallback.
 */

/**
 * Perceived lightness of a finish, 0–1, averaged over every hex colour in the
 * gradient. The face has to sit on both "Corporate Gold" and "Executive
 * Black", so the foreground is chosen from the finish rather than fixed —
 * white-on-silver was the unreadable case.
 */
function finishLightness(color: string): number {
  const hexes = color.match(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi);
  if (!hexes || hexes.length === 0) return 0;

  const total = hexes.reduce((sum, hex) => {
    const raw = hex.slice(1);
    const full =
      raw.length === 3
        ? raw
            .split('')
            .map((c) => c + c)
            .join('')
        : raw;

    const r = parseInt(full.slice(0, 2), 16) / 255;
    const g = parseInt(full.slice(2, 4), 16) / 255;
    const b = parseInt(full.slice(4, 6), 16) / 255;

    // Rec. 709 luma. Close enough to relative luminance for a light/dark
    // decision, without the per-channel gamma expansion.
    return sum + (0.2126 * r + 0.7152 * g + 0.0722 * b);
  }, 0);

  return total / hexes.length;
}

interface CardFaceProps {
  /** Design name, set on the face the way it would be printed. */
  name: string;
  /** The design's finish: any CSS background value (usually a gradient). */
  color: string;
  /** Small line under the name — the tier or the material. */
  label?: string;
  className?: string;
}

export default function CardFace({ name, color, label, className = '' }: CardFaceProps) {
  const isLight = finishLightness(color) > 0.55;

  // Ink on a light finish, bone on a dark one.
  const fg = isLight ? '#12100C' : '#F1F3F1';
  const hairline = isLight ? 'rgba(18, 16, 12, 0.16)' : 'rgba(241, 243, 241, 0.20)';
  const chipBg = isLight ? 'rgba(18, 16, 12, 0.08)' : 'rgba(241, 243, 241, 0.12)';

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${className}`}
      style={{ background: color }}
      role="img"
      aria-label={`${name} NFC card${label ? `, ${label}` : ''}`}
    >
      {/* Sheen. One diagonal band, the way light falls across a real card. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(112deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 34%, rgba(0,0,0,0.10) 100%)',
        }}
      />

      {/* Inner hairline, so the face has an edge on a panel of any colour. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: `inset 0 0 0 1px ${hairline}` }}
      />

      {/* NFC mark — the arcs, drawn rather than an icon font, radiating from
          the corner the chip sits behind. */}
      <svg
        className="absolute right-4 top-4"
        width="26"
        height="26"
        viewBox="0 0 26 26"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="13" cy="13" r="13" fill={chipBg} />
        <g stroke={fg} strokeWidth="1.4" strokeLinecap="round" opacity="0.9">
          <path d="M9.5 17.5c0-2 0-4 0-5.5" opacity="0.55" />
          <path d="M9 17.5a4.6 4.6 0 0 1 0-9" />
          <path d="M12.4 17.5a7.4 7.4 0 0 1 0-9" opacity="0.75" />
          <path d="M15.8 17.5a10 10 0 0 1 0-9" opacity="0.5" />
        </g>
      </svg>

      {/* Name plate, bottom left, set like print rather than UI text. */}
      <div className="absolute inset-x-4 bottom-4">
        <p
          className="truncate"
          style={{
            color: fg,
            fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, monospace',
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
            className="mt-1 truncate"
            style={{
              color: fg,
              opacity: 0.66,
              fontFamily: 'var(--font-mono), ui-monospace, SFMono-Regular, monospace',
              fontSize: '0.625rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </p>
        ) : null}
      </div>
    </div>
  );
}
