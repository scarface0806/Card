"use client";

import { useState, useEffect, useCallback } from "react";
import productService, {
  ProductFilters,
  ProductsResponse,
  CreateProductData,
  UpdateProductData,
} from "@/services/products";
import { Product } from "@prisma/client";

interface UseProductsState {
  products: Product[];
  pagination: ProductsResponse["pagination"] | null;
  loading: boolean;
  error: string | null;
}

interface UseProductsReturn extends UseProductsState {
  fetchProducts: (filters?: ProductFilters) => Promise<void>;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProducts(initialFilters?: ProductFilters): UseProductsReturn {
  const [state, setState] = useState<UseProductsState>({
    products: [],
    pagination: null,
    loading: true,
    error: null,
  });
  const [filters, setFilters] = useState<ProductFilters | undefined>(
    initialFilters
  );

  const fetchProducts = useCallback(async (newFilters?: ProductFilters) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    setFilters(newFilters);

    try {
      const data = await productService.getProducts(newFilters);
      setState({
        products: data.products,
        pagination: data.pagination,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch products",
      }));
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!state.pagination?.hasMore || state.loading) return;

    setState((prev) => ({ ...prev, loading: true }));

    try {
      const nextPage = (state.pagination?.page || 1) + 1;
      const data = await productService.getProducts({
        ...filters,
        page: nextPage,
      });

      setState((prev) => ({
        products: [...prev.products, ...data.products],
        pagination: data.pagination,
        loading: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load more",
      }));
    }
  }, [filters, state.pagination, state.loading]);

  const refresh = useCallback(async () => {
    await fetchProducts(filters);
  }, [filters, fetchProducts]);

  useEffect(() => {
    fetchProducts(initialFilters);
  }, []);

  return {
    ...state,
    fetchProducts,
    loadMore,
    refresh,
  };
}

interface UseProductState {
  product: Product | null;
  loading: boolean;
  error: string | null;
}

interface UseProductReturn extends UseProductState {
  fetchProduct: (idOrSlug: string) => Promise<void>;
}

export function useProduct(idOrSlug?: string): UseProductReturn {
  const [state, setState] = useState<UseProductState>({
    product: null,
    loading: !!idOrSlug,
    error: null,
  });

  const fetchProduct = useCallback(async (id: string) => {
    setState({ product: null, loading: true, error: null });

    try {
      const data = await productService.getProduct(id);
      setState({ product: data.product, loading: false, error: null });
    } catch (err) {
      setState({
        product: null,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to fetch product",
      });
    }
  }, []);

  useEffect(() => {
    if (idOrSlug) {
      fetchProduct(idOrSlug);
    }
  }, [idOrSlug, fetchProduct]);

  return { ...state, fetchProduct };
}

interface UseProductMutationsReturn {
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
  createProduct: (data: CreateProductData) => Promise<Product | null>;
  updateProduct: (id: string, data: UpdateProductData) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useProductMutations(): UseProductMutationsReturn {
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = useCallback(
    async (data: CreateProductData): Promise<Product | null> => {
      setCreating(true);
      setError(null);

      try {
        const response = await productService.createProduct(data);
        setCreating(false);
        return response.product;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create product");
        setCreating(false);
        return null;
      }
    },
    []
  );

  const updateProduct = useCallback(
    async (id: string, data: UpdateProductData): Promise<Product | null> => {
      setUpdating(true);
      setError(null);

      try {
        const response = await productService.updateProduct(id, data);
        setUpdating(false);
        return response.product;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update product");
        setUpdating(false);
        return null;
      }
    },
    []
  );

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    setDeleting(true);
    setError(null);

    try {
      await productService.deleteProduct(id);
      setDeleting(false);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      setDeleting(false);
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    creating,
    updating,
    deleting,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    clearError,
  };
}
