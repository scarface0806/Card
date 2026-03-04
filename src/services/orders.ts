// Order Service - API functions for order operations

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customization?: Record<string, string>;
}

export interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface CreateOrderData {
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  notes?: string;
  couponCode?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentId?: string;
  shippingAddress: Address;
  billingAddress?: Address;
  guestEmail?: string;
  guestName?: string;
  guestPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export interface OrdersResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Get user's orders
export async function getUserOrders(
  filters: OrderFilters = {}
): Promise<OrdersResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.status) params.set("status", filters.status);
  
  const url = `/api/orders${params.toString() ? `?${params.toString()}` : ""}`;
  
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch orders");
  }

  return response.json();
}

// Get single order by ID
export async function getOrder(orderId: string): Promise<Order> {
  const response = await fetch(`/api/orders/${orderId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch order");
  }

  return response.json();
}

// Create new order
export async function createOrder(
  data: CreateOrderData
): Promise<{ message: string; order: Order }> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create order");
  }

  return response.json();
}

// ============ Admin Functions ============

// Get all orders (admin only)
export async function getAllOrders(
  filters: OrderFilters = {}
): Promise<OrdersResponse & { summary: { total: number; byStatus: Record<string, number> } }> {
  const params = new URLSearchParams();
  
  if (filters.page) params.set("page", filters.page.toString());
  if (filters.limit) params.set("limit", filters.limit.toString());
  if (filters.status) params.set("status", filters.status);
  if (filters.paymentStatus) params.set("paymentStatus", filters.paymentStatus);
  if (filters.search) params.set("search", filters.search);
  if (filters.startDate) params.set("startDate", filters.startDate);
  if (filters.endDate) params.set("endDate", filters.endDate);
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

  const url = `/api/admin/orders${params.toString() ? `?${params.toString()}` : ""}`;
  
  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch orders");
  }

  return response.json();
}

// Get single order (admin)
export async function getAdminOrder(orderId: string): Promise<Order> {
  const response = await fetch(`/api/admin/orders/${orderId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch order");
  }

  return response.json();
}

// Update order status (admin only)
export async function updateOrderStatus(
  orderId: string,
  data: {
    status?: string;
    paymentStatus?: string;
    notes?: string;
  }
): Promise<{ message: string; order: Order }> {
  const response = await fetch(`/api/admin/orders/${orderId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update order");
  }

  return response.json();
}

// Cancel order (admin only)
export async function cancelOrder(
  orderId: string
): Promise<{ message: string }> {
  const response = await fetch(`/api/admin/orders/${orderId}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to cancel order");
  }

  return response.json();
}
