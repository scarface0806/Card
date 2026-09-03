"use client";

import { useState, useEffect, useCallback } from "react";
import { Product } from "@prisma/client";
import productService from "@/services/products";
import { isAbortError, logFetchError } from "@/lib/fetch-utils";
import { formatPrice } from "@/utils/formatPrice";
import {
  type CardTier,
  deriveCardColor,
  deriveCardTier,
  effectivePrice,
  hasDiscount,
  tierLabel,
} from "@/lib/products/presentation";

/**
 * The catalogue's view of a product.
 *
 * `id` is the Product id and is what /cards passes to checkout, so the page a
 * customer lands on is unambiguously the product they clicked. It used to pass
 * `slug`, which /create-card then looked up in a hardcoded array of card tiers
 * - no database slug was ever in that array, so every admin-created product
 * silently fell back to "Modern Minimalist, 599".
 *
 * THERE ARE NO FALLBACK DESIGNS IN THIS FILE ANY MORE. It used to seed itself
 * with six hardcoded cards at invented prices and fake ids "1".."6". When the
 * products API failed, /cards showed six products that did not exist, at
 * prices nobody had set, whose buy buttons led nowhere real. An honest empty
 * state is better than a confident wrong one.
 */
export interface CardDesign {
  id: string;
  name: string;
  slug: string;
  type: CardTier;
  typeLabel: string;
  /** What the customer is charged, formatted. */
  price: string;
  priceValue: number;
  /** List price, only when a discount is active. For struck-through display. */
  listPrice?: string;
  color: string;
  description?: string;
  images: string[];
  /**
   * The card's back face, straight from `Product.backImage`.
   *
   * Optional: a product with no back image simply does not offer the flip.
   * When it is absent, resolveCardBackImage() still tries the `-back` naming
   * convention against `images[0]`, so artwork that predates the field keeps
   * working.
   */
  backImage?: string;
  cardType?: string;
  material?: string;
}

function productToCardDesign(product: Product): CardDesign {
  const tier = deriveCardTier(product);
  const price = effectivePrice(product);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    type: tier,
    typeLabel: tierLabel(tier),
    price: formatPrice(price),
    priceValue: price,
    listPrice: hasDiscount(product) ? formatPrice(product.price) : undefined,
    color: deriveCardColor(product),
    description: product.description || undefined,
    images: product.images || [],
    backImage: product.backImage || undefined,
    cardType: product.cardType || undefined,
    material: product.material || undefined,
  };
}

interface UseCardDesignsReturn {
  cardDesigns: CardDesign[];
  loading: boolean;
  error: string | null;
  getDesignById: (id: string) => CardDesign | undefined;
  refresh: () => Promise<void>;
}

export function useCardDesigns(): UseCardDesignsReturn {
  const [cardDesigns, setCardDesigns] = useState<CardDesign[]>([]);
  // Starts true and means what it says: there is genuinely nothing to render
  // until the fetch resolves, because the state is no longer pre-seeded with
  // invented products.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCardDesigns = useCallback(async (signal?: AbortSignal) => {
    try {
      setError(null);
      const response = await productService.getProducts(
        {
          limit: 50,
          sortBy: "price",
          sortOrder: "asc",
        },
        signal
      );

      if (signal?.aborted) return;

      setCardDesigns(response.products.map(productToCardDesign));
    } catch (err) {
      if (signal?.aborted || isAbortError(err)) return;

      logFetchError("Failed to fetch card designs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch designs");
      // No substitute catalogue. /cards renders its empty state instead.
      setCardDesigns([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchCardDesigns(controller.signal);

    return () => controller.abort();
  }, [fetchCardDesigns]);

  // Arg-less wrapper so passing `refresh` to onClick cannot leak a
  // React event into the AbortSignal parameter.
  const refresh = useCallback(() => fetchCardDesigns(), [fetchCardDesigns]);

  const getDesignById = useCallback(
    (id: string) => cardDesigns.find((d) => d.id === id),
    [cardDesigns]
  );

  return {
    cardDesigns,
    loading,
    error,
    getDesignById,
    refresh,
  };
}
