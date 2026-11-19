'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, Eye } from 'lucide-react';
import NFCCard from '@/components/ui/NFCCard';
import CardFlipImage from '@/components/ui/CardFlipImage';
import CardArtwork from '@/components/ui/CardArtwork';
import type { CardDesign } from '@/lib/products/cardDesign';
import type { CardOrientation } from '@/lib/products/orientation';

/**
 * One product tile on /cards. Extracted from CardsClient so the "Horizontal
 * Cards" and "Vertical Cards" sections render the exact same tile.
 *
 * THE ARTWORK WELL
 * The card face sits on the #E8E3D8 well with padding, drawn at its OWN shape
 * (max-w/max-h, never object-cover), so the whole face always shows. The old
 * tile filled a 1:1.6 box with object-cover; any upload not cut to exactly that
 * ratio lost its top and bottom - the "stray fragment" at the bottom edge of
 * the Instagram card was the start of a line the crop had cut through.
 *
 * The well's height is set by padding-top as a calc() of its width - the card
 * ratio plus the padding - rather than an aspect-ratio class, so the inner
 * area is exactly card-shaped: artwork cut to the real ratio fills it edge to
 * edge, anything else is letterboxed inside it. Every tile in a section shares
 * the same well, so rows are level and the buttons line up.
 *
 * The deeper bottom padding (pb-14) holds the "View back" control, so it sits
 * BELOW the artwork instead of on it - it used to cover the artwork's own
 * heading. The NFC mark seen on some tiles is part of the uploaded artwork
 * itself, not drawn here, so nothing is layered over that corner any more.
 */

/** Well height = inner card shape (width minus 2rem side padding) + 4.5rem vertical padding. */
export const WELL_SIZE: Record<CardOrientation, string> = {
  horizontal: 'pt-[calc((100%_-_2rem)/1.6_+_4.5rem)]',
  vertical: 'pt-[calc((100%_-_2rem)*1.6_+_4.5rem)]',
};

/** The card-shaped area inside the well. */
export const FACE_AREA = 'absolute inset-0 flex items-center justify-center px-4 pt-4 pb-14';

/** The artwork at its natural shape, never cropped, with card corners and lift. */
export const FACE_IMAGE =
  'block max-h-full max-w-full h-auto w-auto rounded-[10px] shadow-[0_6px_18px_rgba(18,16,12,0.22)]';

export default function CatalogueTile({
  card,
  index,
  onPreview,
  onBuy,
}: {
  card: CardDesign;
  index: number;
  onPreview: (card: CardDesign) => void;
  onBuy: (card: CardDesign) => void;
}) {
  return (
    // Card reveal. Deliberately NOT parent-orchestrated variants (container
    // `initial="hidden" animate="visible"` + `staggerChildren`): the tiles
    // mount after the products arrive, after the parent's animation has
    // finished, so they never received "visible" and stayed at opacity 0.
    // Each tile animates itself on mount, the stagger a per-index delay.
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: Math.min(index, 8) * 0.06 }}
      className="group tv-panel flex flex-col h-full overflow-hidden"
    >
      {/* Card Preview. CardFlipImage adds the back behind the front face and
          the control to turn it over, and collapses back to just the front
          when the card has no back image. */}
      <CardFlipImage
        frontSrc={card.images?.[0]}
        backImage={card.backImage}
        name={card.name}
        className={`h-0 ${WELL_SIZE[card.orientation]} overflow-hidden bg-[#E8E3D8]`}
        backFaceClassName={FACE_AREA}
        imageClassName={FACE_IMAGE}
        // Bottom-left, in the well's own padding - off the artwork on both
        // orientations - and a full 44px tap target.
        controlClassName="left-3 bottom-1.5 min-h-[44px] px-3.5"
        front={
          /* A photograph if the design has one; otherwise the finish is drawn.
             Every design carries a gradient, so nothing needs to fall back to
             a grey placeholder. */
          card.images?.[0] ? (
            <div className={FACE_AREA}>
              <CardArtwork
                src={card.images[0]}
                alt={`${card.name} NFC card`}
                name={card.name}
                label={card.material || undefined}
                loading="lazy"
                className={FACE_IMAGE}
              />
            </div>
          ) : (
            // The drawn face fills its box, so give it the exact card-shaped
            // area of the well.
            <div className="absolute left-4 right-4 top-4 bottom-14 overflow-hidden rounded-[10px] shadow-[0_6px_18px_rgba(18,16,12,0.22)]">
              <NFCCard name={card.name} color={card.color} label={card.material || undefined} />
            </div>
          )
        }
        overlay={
          /* Quick view. Revealed on focus-within as well as hover, so the
             button is reachable from the keyboard.

             The scrim is pointer-transparent so that clicking the artwork
             flips it; only the button itself takes the pointer, so Quick view
             behaves as it always has. */
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-[#12100C]/55 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              onClick={() => onPreview(card)}
              className="tv-btn tv-btn-secondary pointer-events-auto !text-[#F1F3F1] !border-[#F1F3F1]/45 !bg-[#12100C]/60"
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              Quick view
              <span className="sr-only"> of {card.name}</span>
            </button>
          </div>
        }
      />

      {/* Card Details */}
      <div className="flex flex-col grow tv-panel-pad">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="tv-h4">{card.name}</h3>
          <span className="tv-mono shrink-0 pt-1">{card.typeLabel}</span>
        </div>

        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline gap-2.5">
            <p
              className="text-2xl font-semibold text-[#12100C]"
              style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
            >
              {card.price}
            </p>
            {card.listPrice && (
              <p
                className="text-sm line-through text-[#4C534F]"
                style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
              >
                {card.listPrice}
              </p>
            )}
          </div>
          {/* This line renders once per card, so the lifetime-website claim is
              deliberately not repeated here - it is made once, in the section
              below the grid. */}
          <p className="tv-small mt-1">
            {card.type === 'custom' ? 'Base NFC card price' : 'Includes your digital profile'}
          </p>
        </div>

        {/* The per-card spec bullets used to sit here. Removed from the tile
            on purpose: the same claims are made once, in the "Included with
            every card" grid below, and repeating them on every card only added
            height. `product.features` still carries them on the checkout rail
            — the data is intact, it is just not printed here. */}

        {/* Action, pinned to the bottom so buttons line up across a row.
            Custom designs open the enquiry modal, so they take the contact
            label rather than the buy label. */}
        <div className="mt-auto">
          <button
            onClick={() => onBuy(card)}
            className={`tv-btn w-full ${card.type === 'custom' ? 'tv-btn-secondary' : 'tv-btn-gilded'}`}
          >
            {card.type === 'custom' ? (
              <span>Talk to our team</span>
            ) : (
              <>
                <span>Get your card</span>
                <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.article>
  );
}
