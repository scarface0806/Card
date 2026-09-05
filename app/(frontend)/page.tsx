/**
 * Home.
 *
 * A SERVER COMPONENT that loads the catalogue once and hands it to the client
 * shell. The "The cards" section used to fetch it from a `useEffect`, so that
 * section rendered "Loading card designs" on every visit even though the page
 * itself was already prerendered as static HTML.
 *
 * getCardDesigns() reads the database directly and caches the result; it does
 * NOT call /api/products, which is untouched. The same cache entry serves
 * /cards, so the two pages share one database read per revalidate window.
 */

import { getCardDesigns } from '@/lib/products/getCardDesigns';

import HomeClient from './HomeClient';

/**
 * 300 = five minutes, matching /cards. Must be a literal - Next statically
 * analyses segment config and rejects an imported constant. The reasoning for
 * the value lives on CATALOGUE_REVALIDATE_SECONDS in
 * src/lib/products/getCardDesigns.ts; keep the two in step.
 */
export const revalidate = 300;

export default async function Home() {
  const cardDesigns = await getCardDesigns();

  return <HomeClient initialDesigns={cardDesigns} />;
}
