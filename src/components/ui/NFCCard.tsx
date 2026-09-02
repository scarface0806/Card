'use client';

import { AnimatePresence, motion } from 'framer-motion';

import { SITE_HOST } from '@/lib/site-config';

/**
 * NFC CARD — the one drawn card face. Every place a card is shown flat uses
 * this: the hero, the finishes section, the Quick-view modal, the catalogue
 * tiles on the homepage and on /cards.
 *
 * The card is a static object. There is no rotation, no drag, no pointer
 * tracking, no perspective and no back face anywhere in this file — the
 * 360-degree viewer this replaced is deleted. The only motion is decorative
 * and lives in CSS (`HERO / SHOWCASE CARD` in globals.css): an ambient glow
 * that pulses on transform + opacity, and one slow sheen sweep. Both are
 * silenced under prefers-reduced-motion.
 *
 * Two densities:
 *
 *  - Catalogue / Quick-view (`glow` omitted): a bare face, `name` + `label`.
 *    The caller supplies the frame, because in a catalogue tile the tile *is*
 *    the frame. Renders exactly what the old CardFace did.
 *  - Hero / finishes (`glow`): the face plus its stage — glow behind, frame
 *    with the sheen clipped to its radius.
 */

/** The four finishes offered on the site. */
export const NFC_CARD_FINISHES = {
  obsidian: 'linear-gradient(145deg, #2C3134 0%, #171B1D 45%, #0A0C0D 100%)',
  ocean: 'linear-gradient(145deg, #1E5567 0%, #123B4B 45%, #071E29 100%)',
  emerald: 'linear-gradient(145deg, #328565 0%, #1B5A44 45%, #0B3125 100%)',
  roseGold: 'linear-gradient(145deg, #E8B49C 0%, #BE7C61 32%, #8A5240 68%, #5A2F24 100%)',
} as const;

export type NFCCardVariant = keyof typeof NFC_CARD_FINISHES;

/**
 * Glow tints, per finish.
 *
 * `a` is the dominant pool, `b` the secondary. Obsidian carries the two brand
 * accents unchanged — --tv-patina (#4CAE89) and --tv-brass (#C9A961), the same
 * pair the hero ground is already lit with. The other three pull `a` from the
 * finish's own top stop so the glow reads as light coming off *that* card,
 * and keep a brand accent in `b` so the section still belongs to the site.
 *
 * These are consumed as the custom properties --tv-glow-a / --tv-glow-b, which
 * are registered with @property in globals.css so a swatch swap cross-fades
 * the tint instead of cutting to it.
 */
const GLOW_TINTS: Record<NFCCardVariant, { a: string; b: string }> = {
  obsidian: { a: 'rgba(76, 174, 137, 0.55)', b: 'rgba(201, 169, 97, 0.40)' },
  ocean: { a: 'rgba(42, 114, 136, 0.58)', b: 'rgba(76, 174, 137, 0.34)' },
  emerald: { a: 'rgba(70, 167, 131, 0.58)', b: 'rgba(201, 169, 97, 0.34)' },
  roseGold: { a: 'rgba(190, 124, 97, 0.55)', b: 'rgba(201, 169, 97, 0.42)' },
};

/**
 * The person on the demo card. Defined once: the hero and the finishes section
 * show the same card in different finishes, so they must not drift apart.
 */
export const NFC_CARD_DEMO = {
  name: 'Ananya Rao',
  role: 'Design Lead',
  handle: `${SITE_HOST}/ananya`,
} as const;

/**
 * Perceived lightness of a finish, 0–1, averaged over the hex stops in the
 * given region of the gradient.
 *
 * The gradients run at 145deg, so `top` (the leading stops) describes the
 * corner the finish label and the NFC mark sit in, and `bottom` (the trailing
 * stops) describes the corner the name plate sits in. Rose Gold is the case
 * that forces the split: it is pale at the top and deep copper at the bottom,
 * so one foreground colour cannot serve both — bone on its #E8B49C top stop
 * measures 1.84:1.
 *
 * `all` averages the whole gradient. The catalogue keeps using it, because
 * those finishes come from the database and only ever carry one block of text.
 */
function finishLightness(color: string, region: 'all' | 'top' | 'bottom' = 'all'): number {
  const hexes = color.match(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/gi);
  if (!hexes || hexes.length === 0) return 0;

  const half = Math.ceil(hexes.length / 2);
  const stops =
    region === 'top' ? hexes.slice(0, half) : region === 'bottom' ? hexes.slice(-half) : hexes;

  const total = stops.reduce((sum, hex) => {
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

  return total / stops.length;
}

/** Ink on a light region, bone on a dark one. */
function inkFor(lightness: number) {
  const isLight = lightness > 0.55;
  return {
    fg: isLight ? '#12100C' : '#F1F3F1',
    hairline: isLight ? 'rgba(18, 16, 12, 0.16)' : 'rgba(241, 243, 241, 0.20)',
  };
}

const MONO = 'var(--font-mono), ui-monospace, SFMono-Regular, monospace';

interface NFCCardProps {
  /** Named finish. Ignored when `color` is given. */
  variant?: NFCCardVariant;
  /**
   * Explicit finish: any CSS background value. Catalogue designs come from the
   * database with their own gradient, so they pass this instead of a variant.
   */
  color?: string;
  /** Name set on the face — a person in the hero, a design in the catalogue. */
  name: string;
  /** Job title. Personal card only. */
  role?: string;
  /** Profile URL, e.g. `example.com/ananya`. Personal card only. */
  handle?: string;
  /** Mono uppercase line — the finish, the tier, or the material. */
  label?: string;
  /** Stage width and type scale. Only read when `glow` is set. */
  size?: 'hero' | 'showcase';
  /** Wrap the face in its stage: ambient glow behind, framed, sheen clipped. */
  glow?: boolean;
  className?: string;
}

export default function NFCCard({
  variant = 'obsidian',
  color,
  name,
  role,
  handle,
  label,
  size = 'hero',
  glow = false,
  className = '',
}: NFCCardProps) {
  const finish = color ?? NFC_CARD_FINISHES[variant];

  // The personal card carries a role and/or a profile URL and sets type in two
  // corners; the catalogue face carries neither and stays a plain name plate.
  const isPersonal = Boolean(role || handle);

  const top = inkFor(finishLightness(finish, isPersonal ? 'top' : 'all'));
  const bottom = inkFor(finishLightness(finish, isPersonal ? 'bottom' : 'all'));

  const ariaLabel = isPersonal
    ? `${name}${role ? `, ${role}` : ''} NFC card${label ? `, ${label} finish` : ''}`
    : `${name} NFC card${label ? `, ${label}` : ''}`;

  // Defined once, placed by whichever layout is in play below. The arcs open
  // to the right, radiating away from the card the way a tap gesture reads.
  const nfcMark = (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={top.fg}
      strokeWidth="1.6"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <g opacity="0.6">
        <path d="M8.5 5.5a9 9 0 0 1 0 13" />
        <path d="M12.5 3a13 13 0 0 1 0 18" />
        <path d="M4.5 8.5a5 5 0 0 1 0 7" />
      </g>
    </svg>
  );

  const face = (
    <div
      className={`relative h-full w-full overflow-hidden ${glow ? '' : className}`}
      style={{ background: finish }}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Finish cross-fade. The root above already carries the incoming
          finish, so this holds the OUTGOING one and dissolves it away over
          300ms — one layer, opacity only, and no dip to the ground colour
          half way through. Mounted keyed on the finish, so a card whose
          finish never changes (every catalogue tile) never animates. */}
      <AnimatePresence>
        <motion.div
          key={finish}
          className="pointer-events-none absolute inset-0"
          style={{ background: finish }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        />
      </AnimatePresence>

      {/* Sheen. One diagonal band, the way light falls across a real card. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(112deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.06) 34%, rgba(0,0,0,0.10) 100%)',
        }}
      />

      {/* No fixed specular rake here. A baked-in diagonal highlight and the
          travelling .tv-card-sheen read as two conflicting light sources, and
          the static one is the wrong one to keep — it looks like a print
          defect once you notice it does not move. The sweep does the job. */}

      {/* Inner hairline, so the face has an edge on a panel of any colour. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: `inset 0 0 0 1px ${bottom.hairline}` }}
      />

      {isPersonal ? (
        <>
          {/* Top row: the finish, and the mark for the chip behind it. */}
          <div className="absolute inset-x-5 top-5 flex items-start justify-between gap-3 sm:inset-x-6 sm:top-6">
            {label ? (
              <p
                className="truncate"
                style={{
                  color: top.fg,
                  opacity: 0.66,
                  fontFamily: MONO,
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </p>
            ) : (
              <span />
            )}
            <span className="shrink-0">{nfcMark}</span>
          </div>

          {/* Bottom: the person. */}
          <div
            className="absolute inset-x-5 bottom-5 sm:inset-x-6 sm:bottom-6"
            style={{ color: bottom.fg }}
          >
            <p
              className={`truncate font-semibold leading-tight ${
                size === 'hero'
                  ? 'text-xl sm:text-2xl lg:text-[1.75rem]'
                  : 'text-lg sm:text-xl lg:text-2xl'
              }`}
            >
              {name}
            </p>

            {role ? (
              <p className="mt-0.5 truncate text-xs sm:text-sm" style={{ opacity: 0.72 }}>
                {role}
              </p>
            ) : null}

            {handle ? (
              <div
                className="mt-3 flex items-center justify-between gap-3 pt-3 sm:mt-4"
                style={{ borderTop: `1px solid ${bottom.hairline}` }}
              >
                <p
                  className="truncate"
                  style={{
                    opacity: 0.74,
                    fontFamily: MONO,
                    fontSize: '0.6875rem',
                    letterSpacing: '0.08em',
                  }}
                >
                  {handle}
                </p>
                <p
                  className="shrink-0"
                  style={{
                    opacity: 0.6,
                    fontFamily: MONO,
                    fontSize: '0.625rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                  }}
                >
                  Tap to open
                </p>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <span className="absolute right-4 top-4">{nfcMark}</span>

          {/* Name plate, bottom left, set like print rather than UI text. */}
          <div className="absolute inset-x-4 bottom-4" style={{ color: bottom.fg }}>
            <p
              className="truncate"
              style={{
                fontFamily: MONO,
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
                  opacity: 0.66,
                  fontFamily: MONO,
                  fontSize: '0.625rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}
              >
                {label}
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );

  if (!glow) return face;

  const tint = GLOW_TINTS[color ? 'obsidian' : variant];

  return (
    <div
      className={`tv-card-stage tv-card-stage--${size} ${className}`}
      style={
        {
          '--tv-glow-a': tint.a,
          '--tv-glow-b': tint.b,
        } as React.CSSProperties
      }
    >
      <div className="tv-card-glow" aria-hidden="true" />

      <div className="tv-card-frame">
        {face}
        <span className="tv-card-sheen" aria-hidden="true" />
      </div>
    </div>
  );
}
