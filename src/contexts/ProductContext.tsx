"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { Product } from "@prisma/client";
import productService from "@/services/products";

interface ProductContextType {
  products: Product[];
  featuredProducts: Product[];
  loading: boolean;
  error: string | null;
  getProductBySlug: (slug: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;
  refreshProducts: () => Promise<void>;
  retryProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

interface ProductProviderProps {
  children: ReactNode;
}

export function ProductProvider({ children }: ProductProviderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);
      const response = await productService.getProducts({ limit: 100 }, signal);
      if (!signal?.aborted) {
        setProducts(response.products);
      }
    } catch (err) {
      if (!signal?.aborted) {
        console.error("Failed to fetch products:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch products");
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchProducts]);

  const featuredProducts = products.filter((p) => p.isFeatured);

  const getProductBySlug = useCallback(
    (slug: string) => products.find((p) => p.slug === slug),
    [products]
  );

  const getProductById = useCallback(
    (id: string) => products.find((p) => p.id === id),
    [products]
  );

  return (
    <ProductContext.Provider
      value={{
        products,
        featuredProducts,
        loading,
        error,
        getProductBySlug,
        getProductById,
        refreshProducts: fetchProducts,
        retryProducts: fetchProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProductContext must be used within a ProductProvider");
  }
  return context;
}

// Export a simpler hook for pages/components that just need products
export function useAllProducts() {
  const { products, loading, error } = useProductContext();
  return { products, loading, error };
}
