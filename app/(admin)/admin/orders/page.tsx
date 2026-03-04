"use client";

import React, { useEffect, useState } from "react";
import { Package, Search, Filter } from "lucide-react";
import AdminContainer from "@/components/AdminContainer";
import AdminCard from "@/components/AdminCard";
import AdminTable from "@/components/AdminTable";
import AdminInput from "@/components/AdminInput";
import AdminButton from "@/components/AdminButton";

interface OrderUser {
  id: string;
  name: string;
  email: string;
}

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  user?: OrderUser;
  guestName?: string;
  guestEmail?: string;
  items: OrderItem[];
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, search]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      if (statusFilter) {
        params.append("status", statusFilter);
      }

      if (search) {
        params.append("search", search);
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading orders");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      setUpdating(orderId);

      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error updating order status");
    } finally {
      setUpdating(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCustomerName = (order: Order) => {
    if (order.user?.name) return order.user.name;
    if (order.guestName) return order.guestName;
    if (order.user?.email) return order.user.email;
    if (order.guestEmail) return order.guestEmail;
    return "Guest";
  };

  const getProductDisplay = (order: Order) => {
    if (order.items.length === 0) return "No items";
    const firstItem = order.items[0];
    const more = order.items.length > 1 ? ` +${order.items.length - 1} more` : "";
    return `${firstItem.name} (x${firstItem.quantity})${more}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage customer orders and update their status
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Package className="h-5 w-5" />
          <span>
            {pagination ? `${pagination.total} total orders` : "Loading..."}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by order number, email, or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-slate-900 placeholder-slate-500"
          />
        </div>

        {/* Status Filter */}
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-slate-900 appearance-none bg-white cursor-pointer"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
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
          <div className="text-slate-600">Loading orders...</div>
        </div>
      )}

      {/* Orders Table */}
      {!loading && orders.length > 0 && (
        <AdminCard className="p-0">
          <AdminTable
            header={
              <tr>
                {['Order #','Customer','Product','Total','Status','Date'].map(col=> (
                  <th key={col} className="px-6 py-3">{col}</th>
                ))}
              </tr>
            }
          >
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-mono text-gray-900 font-medium">
                  {order.orderNumber}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="font-medium">{getCustomerName(order)}</div>
                  {order.user?.email && (
                    <div className="text-xs text-gray-500">{order.user.email}</div>
                  )}
                  {order.guestEmail && !order.user && (
                    <div className="text-xs text-gray-500">{order.guestEmail}</div>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {getProductDisplay(order)}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  ${order.total.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusUpdate(order.id, e.target.value)
                    }
                    disabled={updating === order.id}
                    className={`rounded-full px-3 py-1 text-xs font-medium border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDate(order.createdAt)}
                </td>
              </tr>
            ))}
          </AdminTable>
        </AdminCard>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <div className="text-slate-600 mb-2 font-medium">
            {search || statusFilter
              ? "No orders found matching your filters"
              : "No orders yet"}
          </div>
          <div className="text-sm text-slate-500">
            {search || statusFilter
              ? "Try adjusting your search or filter criteria"
              : "Orders will appear here when customers make purchases"}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {(page - 1) * pagination.limit + 1} to{" "}
            {Math.min(page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} orders
          </div>
          <div className="flex gap-2">
            <AdminButton
              variant="secondary"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Previous
            </AdminButton>
            <div className="flex items-center px-4 py-2 text-sm text-slate-600">
              Page {page} of {pagination.totalPages}
            </div>
            <AdminButton
              variant="secondary"
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page >= pagination.totalPages}
            >
              Next
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}
