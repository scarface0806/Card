'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import RightDrawer from '@/components/ui/RightDrawer';
import { ShoppingCart, Filter, RefreshCw } from 'lucide-react';
import { isAbortError, logFetchError } from '@/lib/fetch-utils';

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

type EmailType = 'confirmation' | 'shipped' | 'delivered';

interface OrderEmailLog {
  type: string;
  status: string;
  error?: string | null;
  sentAt?: string | null;
  providerId?: string | null;
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
  recipientEmail?: string | null;
  courierName?: string | null;
  trackingNumber?: string | null;
  trackingUrl?: string | null;
  expectedDeliveryFrom?: string | null;
  expectedDeliveryTo?: string | null;
  printingAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  emailLogs?: OrderEmailLog[];
  user?: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
}

const EMAIL_TYPES: { key: EmailType; label: string; note: string }[] = [
  {
    key: 'confirmation',
    label: 'Order confirmation',
    note: 'Sent automatically once payment is verified.',
  },
  {
    key: 'shipped',
    label: 'Shipped',
    note: 'Needs courier name and tracking number on the order.',
  },
  {
    key: 'delivered',
    label: 'Delivered',
    note: 'Sent automatically when the order is marked delivered.',
  },
];

/** ISO timestamp -> value for an <input type="date">, or '' when unset. */
function toDateInputValue(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
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

  if (normalized === 'SHIPPED') {
    return { tone: 'completed', label: 'Shipped' };
  }

  if (normalized === 'CONFIRMED' || normalized === 'ACCEPTED') {
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
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
  const [shippingForm, setShippingForm] = useState({
    courierName: '',
    trackingNumber: '',
    trackingUrl: '',
    expectedDeliveryFrom: '',
    expectedDeliveryTo: '',
  });
  const [shippingSaving, setShippingSaving] = useState(false);
  const [resendingType, setResendingType] = useState<EmailType | null>(null);

  const closeDrawer = useCallback(() => {
    setSelectedOrder(null);
  }, []);

  const openedOrderId = selectedOrder?.id ?? null;

  useEffect(() => {
    if (!selectedOrder) return;

    setShippingForm({
      courierName: selectedOrder.courierName || '',
      trackingNumber: selectedOrder.trackingNumber || '',
      trackingUrl: selectedOrder.trackingUrl || '',
      expectedDeliveryFrom: toDateInputValue(selectedOrder.expectedDeliveryFrom),
      expectedDeliveryTo: toDateInputValue(selectedOrder.expectedDeliveryTo),
    });
    // Only when the opened order changes - see the comment above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openedOrderId]);

  const lifecycleActionLabel = useCallback((rawStatus: string): string | null => {
    const normalized = rawStatus?.toUpperCase();

    if (normalized === 'PENDING') {
      return 'Accept';
    }

    if (normalized === 'CONFIRMED' || normalized === 'ACCEPTED') {
      return 'Processing';
    }

    if (normalized === 'PROCESSING') {
      return 'Mark Shipped';
    }

    if (normalized === 'SHIPPED') {
      return 'Mark Delivered';
    }

    return null;
  }, []);

  const fetchOrders = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/orders?limit=200', {
        credentials: 'include',
        signal,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch orders');
      }

      const data = await response.json();
      if (signal?.aborted) return;
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
      if (signal?.aborted || isAbortError(err)) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);

    return () => controller.abort();
  }, [fetchOrders]);

  /** Re-read one order, including its per-type email log. */
  const refreshOrderDetails = useCallback(async (id: string) => {
    const response = await fetch(`/api/admin/orders/${id}`, {
      credentials: 'include',
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to fetch order details');
    }

    const order: OrderDetails = await response.json();
    setSelectedOrder(order);
    return order;
  }, []);

  const handleView = async (row: OrderRow) => {
    try {
      setDetailLoading(true);
      await refreshOrderDetails(row.id);
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to fetch order details' });
    } finally {
      setDetailLoading(false);
    }
  };

  /**
   * Save courier / tracking. Separate from the status buttons on purpose: the
   * shipped email refuses to send without a courier and a tracking number, so
   * these get filled in BEFORE the order is marked shipped.
   */
  const saveShipping = async () => {
    if (!selectedOrder) return;

    try {
      setShippingSaving(true);
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shippingForm),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || payload.message || 'Failed to save shipping details');
      }

      await refreshOrderDetails(selectedOrder.id);
      setToast({ variant: 'success', message: 'Shipping details saved' });
    } catch (error) {
      setToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to save shipping details',
      });
    } finally {
      setShippingSaving(false);
    }
  };

  /** Resend one transactional email. Admin-only route; see its own file. */
  const resendEmail = async (type: EmailType) => {
    if (!selectedOrder) return;

    try {
      setResendingType(type);
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/emails`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      const payload = await response.json().catch(() => ({}));
      await refreshOrderDetails(selectedOrder.id).catch(() => undefined);

      if (!response.ok) {
        throw new Error(payload.error || payload.message || 'Failed to resend email');
      }

      setToast({
        // A refused send is not an HTTP failure - the reason is on the row.
        variant: payload.success ? 'success' : 'error',
        message: payload.message || 'Email sent',
      });
    } catch (error) {
      setToast({
        variant: 'error',
        message: error instanceof Error ? error.message : 'Failed to resend email',
      });
    } finally {
      setResendingType(null);
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
            ? 'shipped'
            : normalized === 'SHIPPED'
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
              : nextStatus === 'shipped'
                ? 'SHIPPED'
                : nextStatus === 'completed'
                  ? 'DELIVERED'
                  : null;
        // Re-read the order so the email panel shows what the status change
        // just did to the shipped / delivered send. Non-fatal: the status
        // write has already committed.
        await refreshOrderDetails(row.id).catch(() => undefined);
        setSelectedOrder((prev) => (prev ? { ...prev, status: nextDetailStatus || prev.status } : prev));
      }
      setToast({ variant: 'success', message: `Order ${row.orderID} updated successfully` });
    } catch (error) {
      if (isAbortError(error)) return;
      logFetchError('Order lifecycle update error:', error);
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
      if (isAbortError(error)) return;
      logFetchError('Cancel order error:', error);
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
      if (isAbortError(error)) return;
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
  const filteredOrders =
    statusFilter === 'all'
      ? orders
      : orders.filter((order) => order.statusTone === statusFilter);

  const cycleFilter = () => {
    setStatusFilter((current) => {
      if (current === 'all') return 'pending';
      if (current === 'pending') return 'completed';
      if (current === 'completed') return 'cancelled';
      return 'all';
    });
  };

  return (
    <main className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="tv-adm-page-title">Orders</h1>
          <p className="text-[var(--tv-text-muted)] text-sm mt-1">Review incoming purchase orders and accept or reject them</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <button
            onClick={cycleFilter}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--tv-slate)] hover:bg-[rgba(241,243,241,0.09)] text-[var(--tv-text)] px-4 py-2.5 rounded-xl transition-all font-medium border border-[var(--tv-rule)]"
          >
            <Filter className="w-4 h-4" />
            Filter: {statusFilter === 'all' ? 'All' : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}
          </button>
          <button
            onClick={() => fetchOrders()}
            className="tv-btn tv-btn-gilded w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={openCreateOrder}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[var(--tv-slate)] hover:bg-[rgba(241,243,241,0.09)] text-[var(--tv-text)] px-4 py-2.5 rounded-xl transition-all font-medium border border-[var(--tv-rule)]"
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
        data={loading ? [] : filteredOrders}
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
              <div className="flex items-center justify-between border-b border-[var(--tv-rule)] pb-4">
                <div>
                  <h2 className="tv-adm-panel-title">Order Details</h2>
                  <p className="text-sm text-[var(--tv-text-muted)] mt-1">{selectedOrder.orderNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedPresentation && (
                    <StatusBadge status={selectedPresentation.tone as any} label={selectedPresentation.label} />
                  )}
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="text-[var(--tv-text-muted)] hover:text-[var(--tv-text)]"
                    aria-label="Close order details"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <section className="space-y-3">
                <h3 className="tv-adm-label">Customer Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Customer Name</p>
                    <p className="mt-1 text-[var(--tv-text)]">{selectedOrder.guestName || selectedOrder.user?.name || '-'}</p>
                  </div>
                  <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Email</p>
                    <p className="mt-1 text-[var(--tv-text)] break-all">{selectedOrder.guestEmail || selectedOrder.user?.email || '-'}</p>
                  </div>
                  <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Phone</p>
                    <p className="mt-1 text-[var(--tv-text)]">{selectedOrder.guestPhone || selectedOrder.user?.phone || '-'}</p>
                  </div>
                  <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Order Date</p>
                    <p className="mt-1 text-[var(--tv-text)]">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="tv-adm-label">Products</h3>
                <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4 border-b border-[var(--tv-rule)] pb-2 text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">
                    <span>Product</span>
                    <span>Quantity</span>
                    <span>Price</span>
                    <span className="text-right">Total</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4 py-3 text-sm text-[var(--tv-text)]">
                    <span>{selectedOrder.cardType || 'NFC Card'}</span>
                    <span>1</span>
                    <span>₹{(selectedOrder.price ?? selectedOrder.total ?? 0).toLocaleString()}</span>
                    <span className="text-right">₹{(selectedOrder.total ?? selectedOrder.price ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="tv-adm-label">Shipping Address</h3>
                <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                  <p className="text-[var(--tv-text)]">{selectedOrder.address || '-'}</p>
                </div>
              </section>

              {selectedOrder.notes && (
                <section className="space-y-3">
                  <h3 className="tv-adm-label">Notes</h3>
                  <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                    <p className="text-[var(--tv-text)] whitespace-pre-wrap">{selectedOrder.notes}</p>
                  </div>
                </section>
              )}

              <section className="space-y-3">
                <h3 className="tv-adm-label">Payment Summary</h3>
                <div className="bg-[var(--tv-slate)] rounded-lg p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-[var(--tv-text)]">
                      <span>Subtotal</span>
                      <span>₹{(selectedOrder.price ?? selectedOrder.total ?? 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-[var(--tv-text)]">
                      <span>Tax</span>
                      <span>₹{Math.max((selectedOrder.total ?? 0) - (selectedOrder.price ?? selectedOrder.total ?? 0), 0).toLocaleString()}</span>
                    </div>
                    <div className="border-t border-[var(--tv-rule)] pt-2 flex items-center justify-between text-[var(--tv-text)] font-semibold">
                      <span>Total Amount</span>
                      <span>₹{(selectedOrder.total ?? selectedOrder.price ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="tv-adm-label">Shipping &amp; Tracking</h3>
                <p className="text-xs text-[var(--tv-text-muted)]">
                  Fill in the courier and tracking number before marking the order
                  shipped. Without them the shipped email is not sent - it is
                  recorded as failed instead of going out half empty.
                </p>
                <div className="bg-[var(--tv-slate)] rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Courier</span>
                    <input
                      type="text"
                      value={shippingForm.courierName}
                      onChange={(event) =>
                        setShippingForm((prev) => ({ ...prev, courierName: event.target.value }))
                      }
                      placeholder="Delhivery"
                      className="mt-1 w-full bg-transparent border border-[var(--tv-rule)] rounded-lg px-3 py-2 text-[var(--tv-text)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Tracking number</span>
                    <input
                      type="text"
                      value={shippingForm.trackingNumber}
                      onChange={(event) =>
                        setShippingForm((prev) => ({ ...prev, trackingNumber: event.target.value }))
                      }
                      placeholder="1234567890"
                      className="mt-1 w-full bg-transparent border border-[var(--tv-rule)] rounded-lg px-3 py-2 text-[var(--tv-text)]"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Tracking URL</span>
                    <input
                      type="url"
                      value={shippingForm.trackingUrl}
                      onChange={(event) =>
                        setShippingForm((prev) => ({ ...prev, trackingUrl: event.target.value }))
                      }
                      placeholder="https://..."
                      className="mt-1 w-full bg-transparent border border-[var(--tv-rule)] rounded-lg px-3 py-2 text-[var(--tv-text)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Delivery from</span>
                    <input
                      type="date"
                      value={shippingForm.expectedDeliveryFrom}
                      onChange={(event) =>
                        setShippingForm((prev) => ({ ...prev, expectedDeliveryFrom: event.target.value }))
                      }
                      className="mt-1 w-full bg-transparent border border-[var(--tv-rule)] rounded-lg px-3 py-2 text-[var(--tv-text)]"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs uppercase tracking-wide text-[var(--tv-text-muted)]">Delivery by</span>
                    <input
                      type="date"
                      value={shippingForm.expectedDeliveryTo}
                      onChange={(event) =>
                        setShippingForm((prev) => ({ ...prev, expectedDeliveryTo: event.target.value }))
                      }
                      className="mt-1 w-full bg-transparent border border-[var(--tv-rule)] rounded-lg px-3 py-2 text-[var(--tv-text)]"
                    />
                  </label>
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={saveShipping}
                      disabled={shippingSaving}
                      className="px-4 py-2 rounded-xl bg-[var(--tv-patina)] text-[var(--tv-text)] disabled:opacity-60"
                    >
                      {shippingSaving ? 'Saving...' : 'Save shipping details'}
                    </button>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="tv-adm-label">Customer Emails</h3>
                <p className="text-xs text-[var(--tv-text-muted)]">
                  Sent to{' '}
                  <span className="text-[var(--tv-text)] break-all">
                    {selectedOrder.recipientEmail || 'no recipient address on this order'}
                  </span>
                  . Resending updates the existing log entry rather than adding
                  another one.
                </p>
                <div className="bg-[var(--tv-slate)] rounded-lg divide-y divide-[var(--tv-rule)]">
                  {EMAIL_TYPES.map(({ key, label, note }) => {
                    const log = selectedOrder.emailLogs?.find((entry) => entry.type === key);
                    const status = log?.status ?? 'not_sent';
                    const sentAt = log?.sentAt ? new Date(log.sentAt).toLocaleString() : null;

                    return (
                      <div key={key} className="p-4 flex flex-col sm:flex-row sm:items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-[var(--tv-text)] font-medium">{label}</p>
                          {status === 'sent' && (
                            <p className="text-xs text-[var(--tv-text-muted)] mt-1">
                              Sent{sentAt ? ` ${sentAt}` : ''}
                              {log?.providerId ? ` (${log.providerId})` : ''}
                            </p>
                          )}
                          {status === 'pending' && (
                            <p className="text-xs text-[var(--tv-text-muted)] mt-1">
                              Send in progress...
                            </p>
                          )}
                          {status === 'failed' && (
                            <p className="text-xs text-[rgba(224,122,110,0.95)] mt-1 break-words">
                              Failed: {log?.error || 'no reason recorded'}
                            </p>
                          )}
                          {status === 'not_sent' && (
                            <p className="text-xs text-[var(--tv-text-muted)] mt-1">
                              Not sent yet. {note}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => resendEmail(key)}
                          disabled={resendingType !== null}
                          className="shrink-0 px-3 py-2 rounded-xl border border-[var(--tv-rule)] text-[var(--tv-text)] hover:bg-[rgba(241,243,241,0.09)] disabled:opacity-60"
                        >
                          {resendingType === key
                            ? 'Sending...'
                            : status === 'sent'
                              ? 'Send again'
                              : 'Send now'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="border-t border-[var(--tv-rule)] pt-4">
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[var(--tv-rule)] text-[var(--tv-text)] hover:bg-[var(--tv-slate)]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => advanceOrderStatus(buildOrderRow(selectedOrder))}
                    disabled={!lifecycleActionLabel(selectedOrder.status)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--tv-patina)] text-[var(--tv-text)] hover:bg-[var(--tv-patina)]"
                  >
                    {lifecycleActionLabel(selectedOrder.status) || 'Done'}
                  </button>
                  {selectedOrder.status?.toUpperCase() === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => cancelOrder(buildOrderRow(selectedOrder))}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[rgba(201,169,97,0.90)] text-[var(--tv-text)] hover:bg-[var(--tv-brass)]"
                    >
                      Cancel
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setRejectTarget(buildOrderRow(selectedOrder))}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[rgba(224,122,110,0.90)] text-[var(--tv-text)] hover:bg-[var(--tv-danger)]"
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
              <div className="flex items-start justify-between border-b border-[var(--tv-rule)] pb-4">
                <div>
                  <h2 className="tv-adm-panel-title">Create New Order</h2>
                  <p className="text-sm text-[var(--tv-text-muted)] mt-1">Manually create an order from admin dashboard.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="text-[var(--tv-text-muted)] hover:text-[var(--tv-text)]"
                  aria-label="Close create order drawer"
                >
                  ✕
                </button>
              </div>

              <form className="space-y-4" onSubmit={submitCreateOrder}>
                <div>
                  <label className="tv-adm-field-label">Customer</label>
                  <select
                    value={form.customerId}
                    onChange={(event) => setForm((prev) => ({ ...prev, customerId: event.target.value }))}
                    className="w-full rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] px-3 py-2.5 text-sm text-[var(--tv-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(76,174,137,0.50)]"
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
                  <label className="tv-adm-field-label">Product</label>
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
                    className="w-full rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] px-3 py-2.5 text-sm text-[var(--tv-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(76,174,137,0.50)]"
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
                    <label className="tv-adm-field-label">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={form.quantity}
                      onChange={(event) => setForm((prev) => ({ ...prev, quantity: event.target.value }))}
                      className="w-full rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] px-3 py-2.5 text-sm text-[var(--tv-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(76,174,137,0.50)]"
                      required
                    />
                  </div>
                  <div>
                    <label className="tv-adm-field-label">Price</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.price}
                      onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                      className="w-full rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] px-3 py-2.5 text-sm text-[var(--tv-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(76,174,137,0.50)]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="tv-adm-field-label">Address</label>
                  <textarea
                    value={form.address}
                    onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] px-3 py-2.5 text-sm text-[var(--tv-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(76,174,137,0.50)]"
                    placeholder="Enter shipping/customer address"
                  />
                </div>

                <div>
                  <label className="tv-adm-field-label">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    rows={3}
                    className="w-full rounded-xl border border-[var(--tv-rule)] bg-[var(--tv-graphite)] px-3 py-2.5 text-sm text-[var(--tv-text)] focus:outline-none focus:ring-2 focus:ring-[rgba(76,174,137,0.50)]"
                    placeholder="Order notes"
                  />
                </div>

                <div className="pt-2 border-t border-[var(--tv-rule)] flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl border border-[rgba(241,243,241,0.18)] text-[var(--tv-text)] hover:bg-[rgba(241,243,241,0.06)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[var(--tv-brass)] text-[var(--tv-ink)] font-semibold hover:from-[var(--tv-brass)] hover:to-[var(--tv-brass)] disabled:opacity-60 transition-all"
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
