"use client";

import { useState, useEffect, useCallback } from "react";
import productService from "@/services/products";
import { isAbortError, logFetchError } from "@/lib/fetch-utils";
import {
  productToCardDesign,
  type CardDesign,
} from "@/lib/products/cardDesign";

/**
 * Re-exported so the many components that already import CardDesign from this
 * hook keep working. The type and the transform now live in
 * @/lib/products/cardDesign, because the server loader needs them too and a
 * client hook cannot own them.
 */
export type { CardDesign };

interface UseCardDesignsReturn {
  cardDesigns: CardDesign[];
  loading: boolean;
  error: string | null;
  getDesignById: (id: string) => CardDesign | undefined;
  refresh: () => Promise<void>;
}

/**
 * @param initialDesigns Catalogue already loaded on the server. When supplied,
 *   the hook renders it immediately and does NOT fetch on mount - the data is
 *   in the HTML, so a second request for the same rows would be pure waste and
 *   would reintroduce the loading flash this change removes.
 *
 *   Omit it and the hook behaves exactly as before: empty, loading, fetch on
 *   mount. `refresh()` still re-fetches in both modes.
 */
export function useCardDesigns(
  initialDesigns?: CardDesign[]
): UseCardDesignsReturn {
  const hasInitial = Array.isArray(initialDesigns);

  const [cardDesigns, setCardDesigns] = useState<CardDesign[]>(
    initialDesigns ?? []
  );
  // Only true when there is genuinely nothing to render yet. Seeded from the
  // server it starts false, which is what removes the "Loading card designs"
  // state from the first paint.
  const [loading, setLoading] = useState(!hasInitial);
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
    // Server-rendered catalogue: already on screen, nothing to fetch.
    if (hasInitial) return;

    const controller = new AbortController();
    fetchCardDesigns(controller.signal);

    return () => controller.abort();
  }, [fetchCardDesigns, hasInitial]);

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
