// Dashboard Service - API functions for dashboard metrics

export interface DashboardMetrics {
  customers: {
    total: number;
    active: number;
    disabled: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
    thisMonth: number;
    byStatus: Record<string, number>;
    byPayment: Record<string, number>;
  };
  revenue: {
    total: number;
    thisMonth: number;
  };
  cards: {
    total: number;
    active: number;
    pending: number;
  };
  newsletter: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  leads: {
    total: number;
    unread: number;
    thisMonth: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    customer: string;
  }[];
  generatedAt: string;
}

/**
 * Fetch dashboard metrics (admin only)
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await fetch("/api/admin/dashboard", {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to fetch dashboard metrics");
  }

  return response.json();
}
