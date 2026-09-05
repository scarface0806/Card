/**
 * SERVER-SIDE CATALOGUE LOAD, cached.
 *
 * SERVER ONLY. There is deliberately no `import "server-only"` guard here -
 * that package is not a dependency of this project and adding one was not in
 * scope. The protection is structural instead: this module imports
 * `@/lib/prisma` and `next/cache`, so importing it from a client component
 * fails the build anyway. Do not import it from one.
 *
 * WHY THIS EXISTS
 *
 * /cards and the home page's "The cards" section used to fetch the catalogue
 * from a client `useEffect`, with `cache: "no-store"`. Both pages already
 * prerendered as static HTML, but that HTML contained "Loading card designs"
 * and no cards at all: nothing could render until the JS bundle downloaded,
 * hydrated, fired the effect, and waited on a ~500ms round trip to Atlas -
 * on every single visit. Loading here instead means the cards are in the HTML
 * the moment it arrives.
 *
 * IT DOES NOT CALL /api/products. That route is deliberately untouched and
 * still serves every other consumer exactly as before. Calling it from here
 * would also not work during a static build: there is no server listening at
 * build time, and it would need an absolute origin from the environment.
 *
 * THE QUERY MIRRORS THE ROUTE'S EXACTLY - `isActive: true`, ordered by
 * `createdAt: "desc"`, capped at CATALOGUE_LIMIT. Note the route ignores the
 * `sortBy`/`sortOrder` params the client sends and always orders by createdAt;
 * matching that is what keeps the card ORDER on screen unchanged. If the route
 * ever changes its ordering, change it here too or the two surfaces disagree.
 */

import { unstable_cache } from "next/cache";

import prisma from "@/lib/prisma";

import { productToCardDesign, type CardDesign } from "./cardDesign";

/** Matches the `limit=50` the client used to request. */
const CATALOGUE_LIMIT = 50;

/**
 * Five minutes.
 *
 * The catalogue is edited by an admin adding or re-pricing a product, which is
 * rare - but when it does happen the admin expects to see it on the live site
 * without waiting an hour or redeploying. Five minutes caps the database at
 * ~12 reads an hour no matter the traffic, while keeping the "did my change go
 * live?" loop short enough to be usable.
 */
export const CATALOGUE_REVALIDATE_SECONDS = 300;

const CATALOGUE_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  price: true,
  salePrice: true,
  images: true,
  backImage: true,
  cardType: true,
  material: true,
  color: true,
} as const;

/**
 * Every active card design, shaped for the catalogue UI.
 *
 * Never throws. A database outage returns an empty array, which both surfaces
 * already render as their honest empty state - the same thing that used to
 * happen when the client fetch failed. Throwing here would take the whole
 * statically rendered page down instead.
 */
export const getCardDesigns = unstable_cache(
  async (): Promise<CardDesign[]> => {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: CATALOGUE_LIMIT,
        select: CATALOGUE_SELECT,
      });

      return products.map(productToCardDesign);
    } catch (error) {
      console.error("[catalogue] Failed to load card designs:", error);
      return [];
    }
  },
  ["card-designs"],
  { revalidate: CATALOGUE_REVALIDATE_SECONDS, tags: ["card-designs"] }
);
