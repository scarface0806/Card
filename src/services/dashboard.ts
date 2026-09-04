// Dashboard Service - API functions for dashboard metrics

export interface DashboardRevenueWindows {
  /** The timezone used for the today / month windows. */
  timezone: "Asia/Kolkata";
  /** YYYY-MM-DD in the dashboard timezone, the start of "today". */
  today: string;
  /** YYYY-MM in the dashboard timezone, the start of "this month". */
  month: string;
}

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
    /** Today's revenue. Previously required a second request to /api/dashboard. */
    today: number;
  };
  /** IST day/month window used for the today and thisMonth revenue cards.
   *  Returned by the server so the UI can label the cards with the same
   *  boundary the aggregation used. */
  windows: DashboardRevenueWindows;
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
 * Fetch every dashboard metric in a single request (admin only).
 *
 * Replaces the previous pair of calls to /api/admin/dashboard (21 DB round
 * trips) and /api/dashboard (7 more). The summary endpoint computes all
 * aggregates in the database and caches the result server-side.
 */
export async function getDashboardMetrics(signal?: AbortSignal): Promise<DashboardMetrics> {
  const response = await fetch("/api/dashboard/summary", {
    credentials: "include",
    signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || "Failed to fetch dashboard metrics");
  }

  return response.json();
}
