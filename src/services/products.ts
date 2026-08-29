import { Product } from "@prisma/client";
import { isAbortError, logFetchError } from "@/lib/fetch-utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

export interface ProductFilters {
  page?: number;
  limit?: number;
  category?: string;
  cardType?: string;
  featured?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "price" | "createdAt" | "name";
  sortOrder?: "asc" | "desc";
  showAll?: boolean; // Admin only
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ProductResponse {
  product: Product;
}

export interface CreateProductData {
  name: string;
  slug: string;
  description?: string;
  price: number;
  salePrice?: number;
  images?: string[];
  category?: string;
  tags?: string[];
  sku?: string;
  stock?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  cardType?: string;
  material?: string;
  color?: string;
}

export type UpdateProductData = Partial<CreateProductData>;

class ProductService {
  private get baseUrl(): string {
    // In the browser, always call our own origin with a relative URL.
    //
    // This used to prefer NEXT_PUBLIC_APP_URL over window.location.origin. The
    // moment that value drifts from the origin actually serving the page -
    // which is the case on every preview deployment, and on any deploy where
    // the var is stale - every product request becomes cross-origin and the
    // browser blocks it. The catalogue then silently falls back to hardcoded
    // designs and nobody sees an error.
    if (typeof window !== "undefined") {
      return "/api/products";
    }

    // Server-side rendering has no origin to infer, so it needs the absolute URL.
    return `${API_BASE_URL || "http://localhost:3000"}/api/products`;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    // Get token from cookie or localStorage
    const token =
      typeof window !== "undefined"
        ? document.cookie
            .split("; ")
            .find((row) => row.startsWith("auth-token="))
            ?.split("=")[1]
        : null;

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Get all products with optional filters
   */
  async getProducts(
    filters?: ProductFilters,
    signal?: AbortSignal
  ): Promise<ProductsResponse> {
    const params = new URLSearchParams();

    if (filters) {
      if (filters.page) params.set("page", filters.page.toString());
      if (filters.limit) params.set("limit", filters.limit.toString());
      if (filters.category) params.set("category", filters.category);
      if (filters.cardType) params.set("cardType", filters.cardType);
      if (filters.featured) params.set("featured", "true");
      if (filters.search) params.set("search", filters.search);
      if (filters.minPrice) params.set("minPrice", filters.minPrice.toString());
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice.toString());
      if (filters.sortBy) params.set("sortBy", filters.sortBy);
      if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);
      if (filters.showAll) params.set("showAll", "true");
    }

    const url = `${this.baseUrl}${params.toString() ? `?${params}` : ""}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        const responseBody = await response.text();
        throw new Error(
          `Failed to fetch products: ${response.status} ${response.statusText}${
            responseBody ? ` - ${responseBody}` : ""
          }`
        );
      }

      return response.json();
    } catch (error) {
      // An aborted request is normal teardown (unmount / effect re-run):
      // rethrow it untouched so callers can recognise it, and log nothing.
      if (isAbortError(error)) throw error;

      logFetchError("Product request failed:", error);
      throw new Error("Failed to fetch products", { cause: error });
    }
  }

  /**
   * Get a single product by ID or slug
   */
  async getProduct(
    idOrSlug: string,
    signal?: AbortSignal
  ): Promise<ProductResponse> {
    const response = await fetch(`${this.baseUrl}/${idOrSlug}`, {
      method: "GET",
      cache: "no-store",
      signal,
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Product not found");
      }
      throw new Error("Failed to fetch product");
    }

    return response.json();
  }

  /**
   * Create a new product (Admin only)
   */
  async createProduct(data: CreateProductData): Promise<ProductResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create product");
    }

    return response.json();
  }

  /**
   * Update a product (Admin only)
   */
  async updateProduct(
    id: string,
    data: UpdateProductData
  ): Promise<ProductResponse> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update product");
    }

    return response.json();
  }

  /**
   * Delete a product (Admin only)
   */
  async deleteProduct(id: string): Promise<{ message: string }> {
    const headers = await this.getAuthHeaders();

    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete product");
    }

    return response.json();
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(
    limit = 4,
    signal?: AbortSignal
  ): Promise<ProductsResponse> {
    return this.getProducts({ featured: true, limit }, signal);
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(
    category: string,
    filters?: Omit<ProductFilters, "category">,
    signal?: AbortSignal
  ): Promise<ProductsResponse> {
    return this.getProducts({ ...filters, category }, signal);
  }

  /**
   * Search products
   */
  async searchProducts(
    query: string,
    filters?: Omit<ProductFilters, "search">,
    signal?: AbortSignal
  ): Promise<ProductsResponse> {
    return this.getProducts({ ...filters, search: query }, signal);
  }
}

export const productService = new ProductService();
export default productService;
