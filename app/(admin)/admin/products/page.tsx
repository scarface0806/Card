"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Edit2, Plus, Search } from "lucide-react";
import AdminCard from "@/components/AdminCard";
import AdminTable from "@/components/AdminTable";
import AdminButton from "@/components/AdminButton";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
      const response = await fetch(
        `/api/products?page=${page}&limit=10&showAll=true${searchParam}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading products");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      setDeleting(id);
      const response = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      setProducts(products.filter((p) => p.id !== id));
      alert("Product deleted successfully");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error deleting product");
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      setToggling(id);
      const response = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle product status");
      }

      setProducts(
        products.map((p) =>
          p.id === id ? { ...p, isActive: !currentStatus } : p
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error toggling status");
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Link href="/admin/products/new">
          <AdminButton variant="primary" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </AdminButton>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-slate-900 placeholder-slate-500"
        />
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-slate-600">Loading products...</div>
        </div>
      )}

      {/* Products Table */}
      {!loading && products.length > 0 && (
        <AdminCard className="p-0">
          <AdminTable
            header={
              <tr>
                {['Name','Price','Category','Stock','Status','Actions'].map(col=>(
                  <th key={col} className="px-6 py-3">{col}</th>
                ))}
              </tr>
            }
          >
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                  {product.name}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  ${product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {product.category}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {product.stock}
                </td>
                <td className="px-6 py-4 text-sm">
                  <AdminButton
                    variant="ghost"
                    onClick={() => handleToggleStatus(product.id, product.isActive)}
                    disabled={toggling === product.id}
                    className="disabled:opacity-50 px-0"
                  >
                    {product.isActive ? (
                      <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs text-green-700 cursor-pointer hover:bg-green-200">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700 cursor-pointer hover:bg-slate-200">
                        Inactive
                      </span>
                    )}
                  </AdminButton>
                </td>
                <td className="px-6 py-4 text-sm flex items-center gap-2">
                  <Link href={`/admin/products/${product.id}`}> 
                    <AdminButton variant="ghost" className="p-0" title="Edit">
                      <Edit2 className="h-4 w-4 text-blue-600" />
                    </AdminButton>
                  </Link>
                  <AdminButton
                    variant="danger"
                    onClick={() => handleDelete(product.id)}
                    disabled={deleting === product.id}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </AdminButton>
                </td>
              </tr>
            ))}
          </AdminTable>
        </AdminCard>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <div className="text-slate-600 mb-4">
            {search ? "No products found matching your search" : "No products yet"}
          </div>
          {!search && (
            <Link href="/admin/products/new">
              <AdminButton variant="primary">
                Create your first product →
              </AdminButton>
            </Link>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {(page - 1) * pagination.limit + 1} to{" "}
            {Math.min(page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} products
          </div>
          <div className="flex gap-2">
            <AdminButton
              variant="secondary"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </AdminButton>
            <AdminButton
              variant="secondary"
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={!pagination.hasMore}
            >
              Next
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}
