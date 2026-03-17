import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { Role, OrderStatus, PaymentStatus, CardStatus } from "@prisma/client";

async function safeNumber(label: string, task: () => Promise<number>): Promise<number> {
  try {
    return await task();
  } catch (error) {
    console.error(`[Dashboard] Number metric failed (${label}):`, error);
    return 0;
  }
}

async function safeRevenue(label: string, task: () => Promise<unknown>): Promise<number> {
  try {
    const result = await task();
    const total = (result as { _sum?: { total?: number | null } })?._sum?.total;
    return typeof total === "number" ? total : 0;
  } catch (error) {
    console.error(`[Dashboard] Revenue metric failed (${label}):`, error);
    return 0;
  }
}

async function safeStatusGroups(label: string, task: () => Promise<unknown>): Promise<Array<{ status: string; _count: { status: number } }>> {
  try {
    return (await task()) as Array<{ status: string; _count: { status: number } }>;
  } catch (error) {
    console.error(`[Dashboard] GroupBy failed (${label}):`, error);
    return [];
  }
}

async function safePaymentGroups(
  label: string,
  task: () => Promise<unknown>
): Promise<Array<{ paymentStatus: string; _count: { paymentStatus: number } }>> {
  try {
    return (await task()) as Array<{ paymentStatus: string; _count: { paymentStatus: number } }>;
  } catch (error) {
    console.error(`[Dashboard] GroupBy failed (${label}):`, error);
    return [];
  }
}

async function safeRecentOrders() {
  try {
    return await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        guestEmail: true,
        guestName: true,
      },
    });
  } catch (error) {
    console.error("[Dashboard] Recent orders query failed:", error);
    return [];
  }
}

// GET /api/admin/dashboard - Get dashboard metrics
export async function GET(request: NextRequest) {
  try {
    const customerDelegate = (prisma as unknown as { customer: { count: (args?: unknown) => Promise<number> } }).customer;
    const mainLeadDelegate =
      prisma as unknown as { mainWebsiteLead: { count: (args?: unknown) => Promise<number> } };
    const { user, error } = await authenticate(request);

    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: error || "Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all metrics in parallel for performance
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalCustomers,
      activeCustomers,
      disabledCustomers,
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      ordersThisMonth,
      revenueData,
      revenueThisMonth,
      totalCards,
      activeCards,
      pendingCards,
      totalSubscribers,
      activeSubscribers,
      subscribersThisMonth,
      totalLeads,
      leadsThisMonth,
      recentOrders,
      ordersByStatus,
      ordersByPayment,
    ] = await Promise.all([
      safeNumber("customers.total", () => customerDelegate.count()),
      safeNumber("customers.active", () => customerDelegate.count({ where: { isActive: true } })),
      safeNumber("customers.disabled", () => customerDelegate.count({ where: { isActive: false } })),
      safeNumber("orders.total", () => prisma.order.count()),
      safeNumber("orders.pending", () => prisma.order.count({ where: { status: OrderStatus.PENDING } })),
      safeNumber("orders.completed", () => prisma.order.count({ where: { status: OrderStatus.DELIVERED } })),
      safeNumber("orders.cancelled", () => prisma.order.count({ where: { status: OrderStatus.CANCELLED } })),
      safeNumber("orders.thisMonth", () => prisma.order.count({ where: { createdAt: { gte: monthStart } } })),
      safeRevenue("revenue.total", () => prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: PaymentStatus.PAID } })),
      safeRevenue(
        "revenue.thisMonth",
        () => prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: PaymentStatus.PAID, createdAt: { gte: monthStart } } })
      ),
      safeNumber("cards.total", () => prisma.card.count()),
      safeNumber("cards.active", () => prisma.card.count({ where: { isActive: true, status: CardStatus.ACTIVE } })),
      safeNumber("cards.pending", () => prisma.card.count({ where: { status: CardStatus.PENDING } })),
      safeNumber("newsletter.total", () => prisma.newsletterSubscriber.count()),
      safeNumber("newsletter.active", () => prisma.newsletterSubscriber.count({ where: { isActive: true } })),
      safeNumber("newsletter.thisMonth", () => prisma.newsletterSubscriber.count({ where: { createdAt: { gte: monthStart } } })),
      safeNumber("leads.total", () => mainLeadDelegate.mainWebsiteLead.count()),
      safeNumber("leads.thisMonth", () => mainLeadDelegate.mainWebsiteLead.count({ where: { createdAt: { gte: monthStart } } })),
      safeRecentOrders(),
      safeStatusGroups("orders.byStatus", () => prisma.order.groupBy({ by: ["status"], _count: { status: true } } as never)),
      safePaymentGroups(
        "orders.byPayment",
        () => prisma.order.groupBy({ by: ["paymentStatus"], _count: { paymentStatus: true } } as never)
      ),
    ]);

    // Format order status distribution
    const orderStatusDistribution = (ordersByStatus as Array<{ status: string; _count: { status: number } }>).reduce(
      (acc: Record<string, number>, item) => {
        acc[item.status] = item._count.status || 0;
        return acc;
      },
      {} as Record<string, number>
    );

    // Format payment status distribution
    const paymentStatusDistribution = (ordersByPayment as Array<{ paymentStatus: string; _count: { paymentStatus: number } }>).reduce(
      (acc: Record<string, number>, item) => {
        acc[item.paymentStatus] = item._count.paymentStatus || 0;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        disabled: disabledCustomers,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders,
        cancelled: cancelledOrders,
        thisMonth: ordersThisMonth,
        byStatus: orderStatusDistribution,
        byPayment: paymentStatusDistribution,
      },
      revenue: {
        total: revenueData,
        thisMonth: revenueThisMonth,
      },
      cards: {
        total: totalCards,
        active: activeCards,
        pending: pendingCards,
      },
      newsletter: {
        total: totalSubscribers,
        active: activeSubscribers,
        newThisMonth: subscribersThisMonth,
      },
      leads: {
        total: totalLeads,
        unread: 0,
        thisMonth: leadsThisMonth,
      },
      recentOrders: (recentOrders as Array<{
        id: string;
        orderNumber: string;
        total: number;
        status: string;
        paymentStatus: string;
        createdAt: Date;
        user: { name: string | null; email: string } | null;
        guestEmail: string | null;
        guestName: string | null;
      }>).map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
        customer: order.user?.name || order.guestName || order.user?.email || order.guestEmail || "Guest",
      })),
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
