"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Order,
  OrdersResponse,
  OrderFilters,
  CreateOrderData,
  getUserOrders,
  getOrder,
  createOrder,
  getAllOrders,
  getAdminOrder,
  updateOrderStatus,
  cancelOrder,
} from "@/services/orders";

// ============ User Hooks ============

// Hook for user's orders list
export function useOrders(initialFilters: OrderFilters = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserOrders(filters);
      setOrders(data.orders);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const setStatus = useCallback((status: string | undefined) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  return {
    orders,
    pagination,
    loading,
    error,
    filters,
    setFilters,
    setPage,
    setStatus,
    refetch: fetchOrders,
  };
}

// Hook for single order
export function useOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getOrder(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
  };
}

// Hook for creating orders
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (data: CreateOrderData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createOrder(data);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create order";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createOrder: create,
    loading,
    error,
    clearError: () => setError(null),
  };
}

// ============ Admin Hooks ============

// Hook for admin orders list
export function useAdminOrders(initialFilters: OrderFilters = {}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [summary, setSummary] = useState<{
    total: number;
    byStatus: Record<string, number>;
  }>({ total: 0, byStatus: {} });
  const [filters, setFilters] = useState<OrderFilters>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllOrders(filters);
      setOrders(data.orders);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const setStatus = useCallback((status: string | undefined) => {
    setFilters((prev) => ({ ...prev, status, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search, page: 1 }));
  }, []);

  const setDateRange = useCallback((startDate: string, endDate: string) => {
    setFilters((prev) => ({ ...prev, startDate, endDate, page: 1 }));
  }, []);

  return {
    orders,
    pagination,
    summary,
    loading,
    error,
    filters,
    setFilters,
    setPage,
    setStatus,
    setSearch,
    setDateRange,
    refetch: fetchOrders,
  };
}

// Hook for admin single order
export function useAdminOrder(orderId: string | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminOrder(orderId);
      setOrder(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch order");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    loading,
    error,
    refetch: fetchOrder,
  };
}

// Hook for updating order status
export function useUpdateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback(
    async (
      orderId: string,
      data: {
        status?: string;
        paymentStatus?: string;
        notes?: string;
      }
    ) => {
      setLoading(true);
      setError(null);
      try {
        const result = await updateOrderStatus(orderId, data);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update order";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const cancel = useCallback(async (orderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await cancelOrder(orderId);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to cancel order";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateOrder: update,
    cancelOrder: cancel,
    loading,
    error,
    clearError: () => setError(null),
  };
}
