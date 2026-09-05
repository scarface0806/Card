'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AdminToast from '@/components/admin/AdminToast';
import ProductForm, { ProductFormValues } from '@/components/ProductForm';
import { Package, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { isAbortError } from '@/lib/fetch-utils';

interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  images?: string[];
  image: string;
  /** The back of the card. Empty string when the product has none. */
  backImage: string;
  createdAt: string;
}

interface ToastState {
  variant: 'success' | 'error' | 'info';
  message: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [activeProduct, setActiveProduct] = useState<ProductItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/products?limit=200', {
        credentials: 'include',
        signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch products');
      }

      const data = await response.json();
      if (signal?.aborted) return;
      const mapped: ProductItem[] = (data.products || []).map((product: any) => ({
        id: product.id,
        name: product.name || 'Untitled product',
        description: product.description || '',
        price: Number(product.price || 0),
        images: Array.isArray(product.images) ? product.images : [],
        image: product.image || '',
        backImage: product.backImage || '',
        createdAt: product.createdAt,
      }));

      setProducts(mapped);
    } catch (err) {
      if (signal?.aborted || isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);

    return () => controller.abort();
  }, [fetchProducts]);

  const closeForm = () => {
    setFormOpen(false);
    setActiveProduct(null);
  };

  const openCreate = () => {
    setFormMode('create');
    setActiveProduct(null);
    setFormOpen(true);
  };

  const openEdit = (product: ProductItem) => {
    setFormMode('edit');
    setActiveProduct(product);
    setFormOpen(true);
  };

  const saveProduct = async (values: ProductFormValues) => {
    try {
      setSaving(true);

      const isEdit = formMode === 'edit' && activeProduct;
      const endpoint = isEdit ? `/api/products/${activeProduct.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} product`);
      }

      await fetchProducts();
      setToast({ variant: 'success', message: `Product ${isEdit ? 'updated' : 'created'} successfully` });
      closeForm();
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to save product' });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product: ProductItem) => {
    const allowed = window.confirm(`Delete ${product.name}? This action cannot be undone.`);
    if (!allowed) return;

    const previous = products;
    setProducts((prev) => prev.filter((item) => item.id !== product.id));

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to delete product');
      }

      setToast({ variant: 'success', message: 'Product deleted successfully' });
    } catch (err) {
      setProducts(previous);
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to delete product' });
    }
  };

  return (
    <main className="space-y-6 pb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="tv-adm-page-title">Products</h1>
          {/* tv-adm-page-sub, not a hand-rolled size/colour pair - this is the
              subtitle treatment every other admin page header uses. */}
          <p className="tv-adm-page-sub mt-1">Create, edit and delete frontend product cards from admin</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          {/* Was a bespoke button with its own background, border, padding and
              radius, sitting next to a .tv-btn - so the two controls in this
              one row did not match each other, let alone the rest of admin. */}
          <button
            type="button"
            onClick={() => fetchProducts()}
            className="tv-btn tv-btn-secondary w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="tv-btn tv-btn-gilded w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {error && <AdminToast variant="error" message={error} onClose={() => setError(null)} />}
      {toast && <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}

      {/* tv-adm-panel + panel-head + panel-pad: the same three-part panel every
          other admin page builds with, instead of a one-off rounded box with
          its own radius, border colour and translucent fill. */}
      {formOpen ? (
        <section className="tv-adm-panel">
          <div className="tv-adm-panel-head">
            <h2 className="tv-adm-panel-title">
              {formMode === 'create' ? 'Create Product' : 'Edit Product'}
            </h2>
          </div>
          <div className="tv-adm-panel-pad">
            <ProductForm
              initialValues={
                activeProduct
                  ? {
                      name: activeProduct.name,
                      description: activeProduct.description,
                      price: activeProduct.price,
                      image: activeProduct.image,
                      backImage: activeProduct.backImage,
                    }
                  : undefined
              }
              onSubmit={saveProduct}
              submitLabel={formMode === 'create' ? 'Create Product' : 'Update Product'}
              submitting={saving}
              onCancel={closeForm}
            />
          </div>
        </section>
      ) : null}

      <section className="tv-adm-panel tv-adm-panel-pad">
        {loading ? (
          /* Skeleton cards in the grid's own shape, rather than the single
             line of "Loading products..." text that used to sit here - the
             layout no longer jumps from one line to a three-column grid when
             the fetch lands. */
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] p-4">
                <div className="tv-adm-skeleton aspect-video w-full" />
                <div className="tv-adm-skeleton mt-3 h-4 w-2/3" />
                <div className="tv-adm-skeleton mt-2 h-3 w-full" />
                <div className="tv-adm-skeleton mt-3 h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* tv-adm-empty is the shared empty state - same padding, centring
             and icon treatment as the other admin lists. */
          <div className="tv-adm-empty">
            <span className="tv-adm-empty-icon">
              <Package className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-[var(--tv-text)] font-medium">No products found</p>
            <p className="tv-adm-page-sub">Create your first product to display cards on the frontend.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] p-4">
                <div className="aspect-video overflow-hidden rounded-lg bg-[rgba(7,10,9,0.55)]">
                  <img
                    src={product.images?.[0] || product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-3 text-[var(--tv-text)] font-semibold">{product.name}</h3>
                <p className="mt-1 text-sm text-[var(--tv-text-muted)] line-clamp-2">{product.description}</p>
                <div className="mt-3 text-[var(--tv-patina)] font-semibold">₹{product.price.toLocaleString()}</div>
                <p className="mt-1 text-xs text-[var(--tv-text-muted)]">Created {new Date(product.createdAt).toLocaleDateString()}</p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[rgba(241,243,241,0.18)] px-3 py-2 text-xs text-[var(--tv-text)] hover:bg-[rgba(241,243,241,0.06)]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProduct(product)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[rgba(224,122,110,0.40)] px-3 py-2 text-xs text-[var(--tv-danger)] hover:bg-[rgba(224,122,110,0.10)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
