'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import RightDrawer from '@/components/ui/RightDrawer';
import { ShoppingCart, Filter, RefreshCw } from 'lucide-react';

interface OrderRow {
  id: string;
  sno: number;
  customerName: string;
  phone: string;
  company: string;
  cardType: string;
  price: string;
  statusTone: 'pending' | 'completed' | 'cancelled';
  statusLabel: string;
  createdDate: string;
  orderID: string;
  rawStatus: string;
}

interface OrderDetails {
  id: string;
  orderNumber: string;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  designation?: string | null;
  company?: string | null;
  website?: string | null;
  address?: string | null;
  cardType?: string | null;
  price?: number | null;
  total: number;
  status: string;
  createdAt: string;
  notes?: string | null;
  user?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

interface ToastState {
  variant: 'success' | 'error' | 'info';
  message: string;
}

interface CustomerOption {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface ProductOption {
  id: string;
  name: string;
  price: number;
}

function getStatusPresentation(rawStatus: string): {
  tone: 'pending' | 'completed' | 'cancelled';
  label: string;
} {
  const normalized = rawStatus?.toUpperCase();

  if (normalized === 'CANCELLED' || normalized === 'REFUNDED' || normalized === 'REJECTED') {
    return { tone: 'cancelled', label: 'Cancelled' };
  }

  if (normalized === 'PROCESSING') {
    return { tone: 'pending', label: 'Processing' };
  }

  if (normalized === 'DELIVERED' || normalized === 'COMPLETED') {
    return { tone: 'completed', label: 'Completed' };
  }

  if (
    normalized === 'CONFIRMED' ||
    normalized === 'SHIPPED' ||
    normalized === 'ACCEPTED'
  ) {
    return { tone: 'completed', label: 'Accepted' };
  }

  return { tone: 'pending', label: 'Pending' };
}

function buildOrderRow(details: OrderDetails): OrderRow {
  const presentation = getStatusPresentation(details.status);
  return {
    id: details.id,
    sno: 0,
    customerName: details.guestName || details.user?.name || 'Guest',
    phone: details.guestPhone || details.user?.phone || '-',
    company: details.company || '-',
    cardType: details.cardType || '-',
    price: `₹${(details.price ?? details.total ?? 0).toLocaleString()}`,
    statusTone: presentation.tone,
    statusLabel: presentation.label,
    createdDate: new Date(details.createdAt).toLocaleDateString(),
    orderID: details.orderNumber,
    rawStatus: details.status,
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<OrderRow | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [productOptions, setProductOptions] = useState<ProductOption[]>([]);
  const [form, setForm] = useState({
    customerId: '',
    productId: '',
    quantity: '1',
    price: '',
    address: '',
    notes: '',
  });

  const closeDrawer = useCallback(() => {
    setSelectedOrder(null);
  }, []);

  const lifecycleActionLabel = useCallback((rawStatus: string): string | null => {
    const normalized = rawStatus?.toUpperCase();

    if (normalized === 'PENDING') {
      return 'Accept';
    }

    if (normalized === 'CONFIRMED' || normalized === 'ACCEPTED') {
      return 'Processing';
    }

    if (normalized === 'PROCESSING') {
      return 'Complete';
    }

    return null;
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/orders?limit=200', {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      const mapped: OrderRow[] = (data.orders || []).map((order: any, index: number) => {
        const customerName = order.guestName || order.user?.name || order.guestEmail || order.user?.email || 'Guest';
        const phone = order.guestPhone || order.user?.phone || order.shippingAddress?.phone || '-';
        const company = order.company || '-';
        const cardType = order.cardType || order.items?.[0]?.productName || '-';
        const price = order.price ?? order.total ?? 0;
        const status = getStatusPresentation(order.status);

        return {
          id: order.id,
          sno: index + 1,
          customerName,
          phone,
          company,
          cardType,
          price: `₹${price.toLocaleString()}`,
          statusTone: status.tone,
          statusLabel: status.label,
          createdDate: new Date(order.createdAt).toLocaleDateString(),
          orderID: order.orderNumber,
          rawStatus: order.status,
        };
      });

      setOrders(mapped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleView = async (row: OrderRow) => {
    try {
      setDetailLoading(true);
      const response = await fetch(`/api/admin/orders/${row.id}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch order details');
      }

      const order = await response.json();
      setSelectedOrder(order);
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to fetch order details' });
    } finally {
      setDetailLoading(false);
    }
  };

  const advanceOrderStatus = async (row: OrderRow) => {
    const normalized = row.rawStatus?.toUpperCase();
    const nextStatus =
      normalized === 'PENDING'
        ? 'accepted'
        : normalized === 'CONFIRMED' || normalized === 'ACCEPTED'
          ? 'processing'
          : normalized === 'PROCESSING'
            ? 'completed'
            : null;

    if (!nextStatus) {
      setToast({ variant: 'info', message: `No lifecycle action available for ${row.orderID}` });
      return;
    }

    try {
      const response = await fetch(`/api/orders/${row.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || payload?.message || 'Failed to update order status');
      }

      await fetchOrders();
      if (selectedOrder?.id === row.id) {
        const nextDetailStatus =
          nextStatus === 'accepted'
            ? 'CONFIRMED'
            : nextStatus === 'processing'
              ? 'PROCESSING'
              : nextStatus === 'completed'
                ? 'DELIVERED'
                : null;
        setSelectedOrder((prev) => (prev ? { ...prev, status: nextDetailStatus || prev.status } : prev));
      }
      setToast({ variant: 'success', message: `Order ${row.orderID} updated successfully` });
    } catch (error) {
      console.error('Order lifecycle update error:', error);
      setToast({ variant: 'error', message: error instanceof Error ? error.message : 'Failed to update order' });
    }
  };

  const cancelOrder = async (row: OrderRow) => {
    if (row.rawStatus?.toUpperCase() !== 'PENDING') {
      setToast({ variant: 'info', message: `Only pending orders can be cancelled` });
      return;
    }

    try {
      const response = await fetch(`/api/orders/${row.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'cancelled' }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || payload?.message || 'Failed to cancel order');
      }

      await fetchOrders();
      if (selectedOrder?.id === row.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : prev));
      }
      setToast({ variant: 'success', message: `Order ${row.orderID} cancelled successfully` });
    } catch (error) {
      console.error('Cancel order error:', error);
      setToast({ variant: 'error', message: error instanceof Error ? error.message : 'Failed to cancel order' });
    }
  };

  const handleDelete = (row: OrderRow) => {
    setRejectTarget(row);
  };

  const confirmDelete = async () => {
    if (!rejectTarget) return;

    try {
      setConfirmLoading(true);
      const response = await fetch(`/api/orders/${rejectTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete order');
      }

      await fetchOrders();
      if (selectedOrder?.id === rejectTarget.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : prev));
      }
      setToast({ variant: 'success', message: `Order ${rejectTarget.orderID} deleted successfully` });
      setRejectTarget(null);
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to delete order' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const openCreateOrder = useCallback(async () => {
    setCreateOpen(true);
    try {
      const [customersRes, productsRes] = await Promise.all([
        fetch('/api/customers', { credentials: 'include' }),
        fetch('/api/products', { credentials: 'include' }),
      ]);

      const [customersPayload, productsPayload] = await Promise.all([
        customersRes.json(),
        productsRes.json(),
      ]);

      if (customersRes.ok) {
        setCustomerOptions(customersPayload.customers || []);
      }

      if (productsRes.ok) {
        setProductOptions(productsPayload.products || []);
      }
    } catch (error) {
      setToast({ variant: 'error', message: 'Failed to load customer/product options' });
    }
  }, []);

  const submitCreateOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const quantity = Number(form.quantity || '1');
    const price = Number(form.price || '0');

    if (!form.productId) {
      setToast({ variant: 'error', message: 'Please select a product' });
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setToast({ variant: 'error', message: 'Quantity must be a valid positive number' });
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setToast({ variant: 'error', message: 'Price must be a valid number' });
      return;
    }

    try {
      setCreateLoading(true);
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: form.customerId || undefined,
          productId: form.productId,
          quantity,
          price,
          address: form.address || undefined,
          notes: form.notes || undefined,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || payload.message || 'Failed to create order');
      }

      setToast({ variant: 'success', message: 'Order created successfully' });
      setCreateOpen(false);
      setForm({
        customerId: '',
        productId: '',
        quantity: '1',
        price: '',
        address: '',
        notes: '',
      });
      await fetchOrders();
    } catch (error) {
      setToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to create order',
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const selectedPresentation = selectedOrder ? getStatusPresentation(selectedOrder.status) : null;

  return (
    <main className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Orders</h1>
          <p className="text-gray-400 text-sm mt-1">Review incoming purchase orders and accept or reject them</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/10">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button
            onClick={fetchOrders}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-orange-400 text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-orange-500/20 transition-all font-medium active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={openCreateOrder}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/10"
          >
            <ShoppingCart className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      {error && <AdminToast variant="error" message={error} onClose={() => setError(null)} />}
      {toast && <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}

      <AdminConfirmPanel
        open={!!rejectTarget}
        title="Delete order"
        description={rejectTarget ? `Delete ${rejectTarget.orderID} for ${rejectTarget.customerName}?` : ''}
        confirmText="Delete Order"
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmDelete}
        loading={confirmLoading}
        tone="danger"
      />

      <DataTable
        columns={[
          { key: 'orderID', label: 'Order ID' },
          { key: 'customerName', label: 'Customer Name' },
          { key: 'phone', label: 'Phone' },
          { key: 'company', label: 'Company' },
          { key: 'cardType', label: 'Card Type' },
          { key: 'price', label: 'Price' },
          {
            key: 'statusTone',
            label: 'Status',
            render: (_value, row) => <StatusBadge status={row.statusTone as any} label={row.statusLabel} />,
          },
          { key: 'createdDate', label: 'Created Date' },
        ]}
        data={loading ? [] : orders}
        onView={handleView}
        onDelete={handleDelete}
        actionLabels={{
          view: detailLoading ? 'Loading...' : 'View',
          delete: 'Delete',
        }}
        actionTones={{
          view: 'info',
          delete: 'danger',
        }}
        extraActions={[
          {
            key: 'lifecycle-action',
            label: (row: OrderRow) => lifecycleActionLabel(row.rawStatus) || 'Advance',
            onClick: (row: OrderRow) => advanceOrderStatus(row),
            tone: 'success',
            visible: (row: OrderRow) => Boolean(lifecycleActionLabel(row.rawStatus)),
          },
          {
            key: 'cancel-pending',
            label: 'Cancel',
            onClick: (row: OrderRow) => cancelOrder(row),
            tone: 'warning',
            visible: (row: OrderRow) => row.rawStatus?.toUpperCase() === 'PENDING',
          },
        ]}
      />

      <RightDrawer open={!!selectedOrder} onClose={closeDrawer}>
        {selectedOrder && (
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">Order Details</h2>
                  <p className="text-sm text-slate-400 mt-1">{selectedOrder.orderNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedPresentation && (
                    <StatusBadge status={selectedPresentation.tone as any} label={selectedPresentation.label} />
                  )}
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="text-slate-400 hover:text-white"
                    aria-label="Close order details"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Customer Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Customer Name</p>
                    <p className="mt-1 text-white">{selectedOrder.guestName || selectedOrder.user?.name || '-'}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Email</p>
                    <p className="mt-1 text-white break-all">{selectedOrder.guestEmail || selectedOrder.user?.email || '-'}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Phone</p>
                    <p className="mt-1 text-white">{selectedOrder.guestPhone || selectedOrder.user?.phone || '-'}</p>
                  </div>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Order Date</p>
                    <p className="mt-1 text-white">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Products</h3>
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4 border-b border-slate-700 pb-2 text-xs uppercase tracking-wide text-slate-400">
                    <span>Product</span>
                    <span>Quantity</span>
                    <span>Price</span>
                    <span className="text-right">Total</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 py-3 text-sm text-white">
                    <span>{selectedOrder.cardType || 'NFC Card'}</span>
                    <span>1</span>
                    <span>₹{(selectedOrder.price ?? selectedOrder.total ?? 0).toLocaleString()}</span>
                    <span className="text-right">₹{(selectedOrder.total ?? selectedOrder.price ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Shipping Address</h3>
                <div className="bg-slate-800 rounded-lg p-4">
                  <p className="text-white">{selectedOrder.address || '-'}</p>
                </div>
              </section>

              {selectedOrder.notes && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Notes</h3>
                  <div className="bg-slate-800 rounded-lg p-4">
                    <p className="text-white whitespace-pre-wrap">{selectedOrder.notes}</p>
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Payment Summary</h3>
                <div className="bg-slate-800 rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-gray-300">
                      <span>Subtotal</span>
                      <span>₹{(selectedOrder.price ?? selectedOrder.total ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-300">
                      <span>Tax</span>
                      <span>₹{Math.max((selectedOrder.total ?? 0) - (selectedOrder.price ?? selectedOrder.total ?? 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-slate-700 pt-2 flex items-center justify-between text-white font-semibold">
                      <span>Total Amount</span>
                      <span>₹{(selectedOrder.total ?? selectedOrder.price ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="border-t border-slate-700 pt-4">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-600 text-gray-200 hover:bg-slate-800"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => advanceOrderStatus(buildOrderRow(selectedOrder))}
                    disabled={!lifecycleActionLabel(selectedOrder.status)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500/90 text-white hover:bg-emerald-500"
                  >
                    {lifecycleActionLabel(selectedOrder.status) || 'Done'}
                  </button>
                  {selectedOrder.status?.toUpperCase() === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => cancelOrder(buildOrderRow(selectedOrder))}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500/90 text-white hover:bg-amber-500"
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setRejectTarget(buildOrderRow(selectedOrder))}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-500/90 text-white hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
        )}
      </RightDrawer>

      <RightDrawer open={createOpen} onClose={() => setCreateOpen(false)}>
            <div className="p-4 sm:p-6 space-y-6">
              <div className="flex items-start justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">Create New Order</h2>
                  <p className="text-sm text-gray-400 mt-1">Manually create an order from admin dashboard.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="text-gray-400 hover:text-white"
                  aria-label="Close create order drawer"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4" onSubmit={submitCreateOrder}>
                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Customer</label>
                  <select
                    value={form.customerId}
                    onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
                    className="w-full rounded-xl border border-white/10 bg-[#1a243c] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  >
                    <option value="">Guest Customer</option>
                    {customerOptions.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Product</label>
                  <select
                    value={form.productId}
                    onChange={(event) => {
                      const value = event.target.value;
                      const selected = productOptions.find((product) => product.id === value);
                      setForm((prev) => ({
                        ...prev,
                        productId: value,
                        price: selected ? String(selected.price) : prev.price,
                      }));
                    }}
                    className="w-full rounded-xl border border-white/10 bg-[#1a243c] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    required
                  >
                    <option value="">Select product</option>
                    {productOptions.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-[#1a243c] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 mb-1 block">Price</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.price}
                      onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-[#1a243c] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Address</label>
                  <textarea
                    value={form.address}
                    onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-[#1a243c] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="Enter shipping/customer address"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-1 block">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-[#1a243c] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    placeholder="Order notes"
                  />
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-white/15 text-gray-200 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-400 disabled:opacity-60"
                  >
                    {createLoading ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
      </RightDrawer>
    </main>
  );
}
