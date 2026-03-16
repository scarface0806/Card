'use client';

import React, { useCallback, useEffect, useState } from 'react';
import DataTable from '@/components/admin/DataTable';
import StatusBadge from '@/components/admin/StatusBadge';
import AdminToast from '@/components/admin/AdminToast';
import AdminConfirmPanel from '@/components/admin/AdminConfirmPanel';
import { ShoppingCart, Filter, RefreshCw, X } from 'lucide-react';

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

function getStatusPresentation(rawStatus: string): {
  tone: 'pending' | 'completed' | 'cancelled';
  label: string;
} {
  const normalized = rawStatus?.toUpperCase();

  if (normalized === 'CANCELLED' || normalized === 'REFUNDED' || normalized === 'REJECTED') {
    return { tone: 'cancelled', label: 'Rejected' };
  }

  if (
    normalized === 'CONFIRMED' ||
    normalized === 'PROCESSING' ||
    normalized === 'SHIPPED' ||
    normalized === 'DELIVERED' ||
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

  const handleAccept = async (row: OrderRow) => {
    if (getStatusPresentation(row.rawStatus).label === 'Accepted') {
      setToast({ variant: 'info', message: `Order ${row.orderID} is already accepted` });
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${row.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept order');
      }

      await fetchOrders();
      if (selectedOrder?.id === row.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'CONFIRMED' } : prev));
      }
      setToast({ variant: 'success', message: `Order ${row.orderID} accepted successfully` });
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to accept order' });
    }
  };

  const handleReject = (row: OrderRow) => {
    setRejectTarget(row);
  };

  const confirmReject = async () => {
    if (!rejectTarget) return;

    try {
      setConfirmLoading(true);
      const response = await fetch(`/api/admin/orders/${rejectTarget.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'REJECTED' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject order');
      }

      await fetchOrders();
      if (selectedOrder?.id === rejectTarget.id) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: 'CANCELLED' } : prev));
      }
      setToast({ variant: 'success', message: `Order ${rejectTarget.orderID} rejected successfully` });
      setRejectTarget(null);
    } catch (err) {
      setToast({ variant: 'error', message: err instanceof Error ? err.message : 'Failed to reject order' });
    } finally {
      setConfirmLoading(false);
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
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2a3048] hover:bg-[#313755] text-white px-4 py-2.5 rounded-xl transition-all font-medium border border-white/10">
            <ShoppingCart className="w-4 h-4" />
            New Order
          </button>
        </div>
      </div>

      {error && <AdminToast variant="error" message={error} onClose={() => setError(null)} />}
      {toast && <AdminToast variant={toast.variant} message={toast.message} onClose={() => setToast(null)} />}

      <AdminConfirmPanel
        open={!!rejectTarget}
        title="Reject order"
        description={rejectTarget ? `Reject ${rejectTarget.orderID} for ${rejectTarget.customerName}?` : ''}
        confirmText="Reject Order"
        onCancel={() => setRejectTarget(null)}
        onConfirm={confirmReject}
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
        onEdit={handleAccept}
        onDelete={handleReject}
        actionLabels={{
          view: detailLoading ? 'Loading...' : 'View',
          edit: 'Accept',
          delete: 'Reject',
        }}
        actionTones={{
          view: 'info',
          edit: 'success',
          delete: 'danger',
        }}
      />

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[2px] p-2 sm:p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#161b2e] shadow-2xl overflow-hidden max-h-[95vh]">
            <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-white/10 bg-white/[0.02]">
              <div>
                <h2 className="text-xl font-semibold text-white">Order Details</h2>
                <p className="text-sm text-gray-400 mt-1">{selectedOrder.orderNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
                aria-label="Close order details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 max-h-[78vh] overflow-y-auto">
              <div className="flex flex-wrap items-center gap-3">
                {selectedPresentation && (
                  <StatusBadge status={selectedPresentation.tone as any} label={selectedPresentation.label} />
                )}
                <span className="text-sm text-gray-400">Created {new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Name</p>
                  <p className="text-white mt-1">{selectedOrder.guestName || selectedOrder.user?.name || '-'}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                  <p className="text-white mt-1 break-all">{selectedOrder.guestEmail || selectedOrder.user?.email || '-'}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Phone</p>
                  <p className="text-white mt-1">{selectedOrder.guestPhone || selectedOrder.user?.phone || '-'}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Designation</p>
                  <p className="text-white mt-1">{selectedOrder.designation || '-'}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Company</p>
                  <p className="text-white mt-1">{selectedOrder.company || '-'}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Website</p>
                  <p className="text-white mt-1 break-all">{selectedOrder.website || '-'}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4 md:col-span-2">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Address</p>
                  <p className="text-white mt-1">{selectedOrder.address || '-'}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Card Type</p>
                  <p className="text-white mt-1">{selectedOrder.cardType || '-'}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Price</p>
                  <p className="text-white mt-1">₹{(selectedOrder.price ?? selectedOrder.total ?? 0).toLocaleString()}</p>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Notes</p>
                  <p className="text-white mt-1 whitespace-pre-wrap">{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 bg-[#11182c] px-4 sm:px-6 py-3">
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl border border-white/15 text-gray-200 hover:bg-white/5"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => handleAccept(buildOrderRow(selectedOrder))}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-500/90 text-white hover:bg-emerald-500"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => setRejectTarget(buildOrderRow(selectedOrder))}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-red-500/90 text-white hover:bg-red-500"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
