'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import CardArtwork from '@/components/ui/CardArtwork';
import NFCCard from '@/components/ui/NFCCard';
import type { CardDesign } from '@/lib/products/cardDesign';
import { FACE_AREA, FACE_IMAGE, WELL_SIZE } from '@/components/cards/CatalogueTile';
import { ARTWORK_FILE_NOTE, recommendedArtworkSize } from '@/lib/products/custom-artwork-spec';

/**
 * "Customised card — your own design" on /cards.
 *
 * Products ticked "Customised design" in the admin are shown here instead of
 * in the regular grid, because they are bought differently: the customer
 * uploads a front and a back image at checkout and pays a design charge on
 * top. The breakdown is shown up front so the total at checkout is never a
 * surprise. Every number comes from the product row (via productToCardDesign);
 * nothing here hardcodes a price.
 *
 * The tile reuses the catalogue's tv-panel tile; only the copy differs.
 */
export default function CustomDesignSection({
  designs,
  onSelect,
}: {
  designs: CardDesign[];
  onSelect: (design: CardDesign) => void;
}) {
  if (designs.length === 0) return null;

  return (
    <div className="mt-16 md:mt-20 pt-12 md:pt-14 border-t border-[#12100C]/12">
      <div className="max-w-2xl mb-8 md:mb-10">
        <p className="tv-eyebrow mb-5">Your own design</p>
        <h2 className="tv-h2 mb-4">Customised card — your own design.</h2>
        <p className="tv-body tv-measure-body">
          Already have artwork? Upload your own front and back at checkout and we
          print it on the same NFC card, with the same digital profile.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
        {designs.map((card) => {
          const size = recommendedArtworkSize(card.orientation);
          return (
            <motion.article
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="group tv-panel flex flex-col h-full overflow-hidden"
            >
              {/* Same artwork well as the catalogue tiles (CatalogueTile): the
                  whole card face, uncropped, on padding. */}
              <div className={`relative h-0 ${WELL_SIZE[card.orientation]} overflow-hidden bg-[#E8E3D8]`}>
                {card.images?.[0] ? (
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
                  <div className="absolute left-4 right-4 top-4 bottom-4 overflow-hidden rounded-[10px] shadow-[0_6px_18px_rgba(18,16,12,0.22)]">
                    <NFCCard name={card.name} color={card.color} label={card.material || undefined} />
                  </div>
                )}
              </div>

              <div className="flex flex-col grow tv-panel-pad">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="tv-h4">{card.name}</h3>
                  <span className="tv-mono shrink-0 pt-1">Custom design</span>
                </div>

                <div className="mb-4">
                  <p
                    className="text-2xl font-semibold text-[#12100C]"
                    style={{ fontFamily: 'var(--font-mono), ui-monospace, monospace' }}
                  >
                    {card.price}
                  </p>
                  <p className="tv-small mt-1">
                    {card.cardPrice} card + {card.designFee} design charge
                  </p>
                </div>

                <div className="mb-5">
                  <p className="tv-mono mb-2">What to upload</p>
                  <ul className="space-y-1 list-disc pl-5">
                    <li className="tv-small">Card front and card back, one image each</li>
                    <li className="tv-small">{size.label}</li>
                    <li className="tv-small">{ARTWORK_FILE_NOTE}</li>
                  </ul>
                </div>

                <div className="mt-auto">
                  <button
                    type="button"
                    onClick={() => onSelect(card)}
                    className="tv-btn tv-btn-gilded w-full"
                  >
                    <span>Get your card</span>
                    <ArrowUpRight className="w-[18px] h-[18px]" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
