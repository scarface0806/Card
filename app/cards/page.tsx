/**
 * /cards - the catalogue.
 *
 * A SERVER COMPONENT whose only job is to load the catalogue and hand it to
 * the client component that owns every interactive part of the page. This is
 * what removes the "Loading card designs" state: the cards are rendered into
 * the HTML here, so they are on screen before any JavaScript runs, instead of
 * appearing only after the bundle downloads, hydrates and makes a ~500ms round
 * trip to the database.
 *
 * getCardDesigns() reads the database directly and caches the result. It does
 * NOT call /api/products - that route is untouched and still serves its other
 * consumers exactly as before.
 *
 * ISR rather than fully static: `revalidate` below means the page is served
 * from cache and refreshed in the background, so an admin adding a product
 * sees it live without a redeploy. See CATALOGUE_REVALIDATE_SECONDS for why
 * the window is what it is.
 */

import { getCardDesigns } from '@/lib/products/getCardDesigns';

import CardsClient from './CardsClient';

/**
 * 300 = five minutes. Must be a literal: Next statically analyses segment
 * config at build time and rejects an imported constant ("Invalid segment
 * configuration export"), so this cannot read CATALOGUE_REVALIDATE_SECONDS.
 * Keep the two in step - the reasoning for the value lives on that constant in
 * src/lib/products/getCardDesigns.ts.
 */
export const revalidate = 300;

export default async function CardsPage() {
  const cardDesigns = await getCardDesigns();

  return <CardsClient initialDesigns={cardDesigns} />;
}
