'use client';

import React, { useCallback, useEffect, useState } from 'react';
import AdminToast from '@/components/admin/AdminToast';
import ProductForm, { ProductFormValues } from '@/components/ProductForm';
import { Package, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  images?: string[];
  image: string;
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

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/products?limit=200', {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch products');
      }

      const data = await response.json();
      const mapped: ProductItem[] = (data.products || []).map((product: any) => ({
        id: product.id,
        name: product.name || 'Untitled product',
        description: product.description || '',
        price: Number(product.price || 0),
        images: Array.isArray(product.images) ? product.images : [],
        image: product.image || '',
        createdAt: product.createdAt,
      }));

      setProducts(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
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
          <h1 className="text-2xl font-semibold text-white">Products</h1>
          <p className="text-gray-400 text-sm mt-1">Create, edit and delete frontend product cards from admin</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <button
            type="button"
            onClick={fetchProducts}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/10"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-[#0f2e25] px-4 py-2.5 rounded-xl hover:from-[#28A428] hover:to-[#e6e600] hover:shadow-lg transition-all font-medium active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      </div>

      {error && <AdminToast variant="error" message={error} onClose={() => setError(null)} />}
      {toast && <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}

      {formOpen ? (
        <section className="rounded-2xl border border-white/10 bg-[#101628] p-5">
          <h2 className="text-lg font-semibold text-white mb-4">{formMode === 'create' ? 'Create Product' : 'Edit Product'}</h2>
          <ProductForm
            initialValues={
              activeProduct
                ? {
                    name: activeProduct.name,
                    description: activeProduct.description,
                    price: activeProduct.price,
                    image: activeProduct.image,
                  }
                : undefined
            }
            onSubmit={saveProduct}
            submitLabel={formMode === 'create' ? 'Create Product' : 'Update Product'}
            submitting={saving}
            onCancel={closeForm}
          />
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-[#101628] p-4 sm:p-5">
        {loading ? (
          <p className="text-gray-400">Loading products...</p>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-[#151a2d] p-8 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-gray-500" />
            <p className="text-white font-medium">No products found</p>
            <p className="text-sm text-gray-400 mt-1">Create your first product to display cards on the frontend.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <article key={product.id} className="rounded-xl border border-white/10 bg-[#151a2d] p-4">
                <div className="aspect-video overflow-hidden rounded-lg bg-[#0f1426]">
                  <img
                    src={product.images?.[0] || product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <h3 className="mt-3 text-white font-semibold">{product.name}</h3>
                <p className="mt-1 text-sm text-gray-400 line-clamp-2">{product.description}</p>
                <div className="mt-3 text-primary font-semibold">₹{product.price.toLocaleString()}</div>
                <p className="mt-1 text-xs text-gray-500">Created {new Date(product.createdAt).toLocaleDateString()}</p>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(product)}
                    className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs text-white hover:bg-white/5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProduct(product)}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-400/40 px-3 py-2 text-xs text-red-300 hover:bg-red-500/10"
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
