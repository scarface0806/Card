"use client";

import { useState, useEffect, useCallback } from "react";
import { Product } from "@prisma/client";
import productService from "@/services/products";
import { formatPrice } from "@/utils/formatPrice";

export interface CardDesign {
  id: string;
  name: string;
  slug: string;
  type: "basic" | "premium" | "custom";
  price: string;
  priceValue: number;
  salePrice?: string;
  salePriceValue?: number;
  color: string;
  description?: string;
  images: string[];
  cardType?: string;
  material?: string;
}

// Fallback card designs in case API fails
const fallbackCardDesigns: CardDesign[] = [
  {
    id: "1",
    name: "Modern Minimalist",
    slug: "modern-minimalist",
    type: "basic",
    price: "₹599",
    priceValue: 599,
    color: "linear-gradient(135deg, #e0e0e0 0%, #9e9e9e 100%)",
    images: [],
  },
  {
    id: "2",
    name: "Professional Blue",
    slug: "professional-blue",
    type: "basic",
    price: "₹599",
    priceValue: 599,
    color: "linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)",
    images: [],
  },
  {
    id: "3",
    name: "Executive Black",
    slug: "executive-black",
    type: "basic",
    price: "₹599",
    priceValue: 599,
    color: "linear-gradient(135deg, #424242 0%, #212121 100%)",
    images: [],
  },
  {
    id: "4",
    name: "Creative Gradient",
    slug: "creative-gradient",
    type: "premium",
    price: "₹799",
    priceValue: 799,
    color: "linear-gradient(135deg, #7c4dff 0%, #18ffff 100%)",
    images: [],
  },
  {
    id: "5",
    name: "Corporate Gold",
    slug: "corporate-gold",
    type: "premium",
    price: "₹799",
    priceValue: 799,
    color: "linear-gradient(135deg, #ffd54f 0%, #ff8f00 100%)",
    images: [],
  },
  {
    id: "6",
    name: "Custom Design",
    slug: "custom-design",
    type: "custom",
    price: "₹599",
    priceValue: 599,
    color: "linear-gradient(135deg, #0f2e25 0%, #14532d 100%)",
    description: "Want a fully personalized NFC card? Contact our team.",
    images: [],
  },
];

// Color mapping based on card type or material
function getCardColor(product: Product): string {
  const colorMap: Record<string, string> = {
    standard: "linear-gradient(135deg, #e0e0e0 0%, #9e9e9e 100%)",
    premium: "linear-gradient(135deg, #7c4dff 0%, #18ffff 100%)",
    metal: "linear-gradient(135deg, #424242 0%, #212121 100%)",
    gold: "linear-gradient(135deg, #ffd54f 0%, #ff8f00 100%)",
    blue: "linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)",
    black: "linear-gradient(135deg, #424242 0%, #212121 100%)",
    custom: "linear-gradient(135deg, #0f2e25 0%, #14532d 100%)",
  };

  if (product.color && colorMap[product.color.toLowerCase()]) {
    return colorMap[product.color.toLowerCase()];
  }
  if (product.cardType && colorMap[product.cardType.toLowerCase()]) {
    return colorMap[product.cardType.toLowerCase()];
  }
  return colorMap.standard;
}

// Determine card type from product
function getCardType(product: Product): "basic" | "premium" | "custom" {
  const cardType = product.cardType?.toLowerCase() || "";
  if (cardType === "custom") return "custom";
  if (cardType === "premium" || cardType === "metal" || product.price >= 700) {
    return "premium";
  }
  return "basic";
}

// Convert Product to CardDesign
function productToCardDesign(product: Product): CardDesign {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    type: getCardType(product),
    price: formatPrice(product.price),
    priceValue: product.price,
    salePrice: product.salePrice ? formatPrice(product.salePrice) : undefined,
    salePriceValue: product.salePrice || undefined,
    color: getCardColor(product),
    description: product.description || undefined,
    images: product.images || [],
    cardType: product.cardType || undefined,
    material: product.material || undefined,
  };
}

interface UseCardDesignsReturn {
  cardDesigns: CardDesign[];
  loading: boolean;
  error: string | null;
  getDesignBySlug: (slug: string) => CardDesign | undefined;
  refresh: () => Promise<void>;
}

export function useCardDesigns(): UseCardDesignsReturn {
  const [cardDesigns, setCardDesigns] = useState<CardDesign[]>(fallbackCardDesigns);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCardDesigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProducts({
        limit: 50,
        sortBy: "price",
        sortOrder: "asc",
      });

      if (response.products.length > 0) {
        const designs = response.products.map(productToCardDesign);
        setCardDesigns(designs);
      }
      // If no products, keep fallback
    } catch (err) {
      console.error("Failed to fetch card designs:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch designs");
      // Keep fallback designs on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCardDesigns();
  }, [fetchCardDesigns]);

  const getDesignBySlug = useCallback(
    (slug: string) => cardDesigns.find((d) => d.slug === slug),
    [cardDesigns]
  );

  return {
    cardDesigns,
    loading,
    error,
    getDesignBySlug,
    refresh: fetchCardDesigns,
  };
}

// Export fallback for SSR/initial render
export { fallbackCardDesigns };
