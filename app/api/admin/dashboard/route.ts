import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { Role, OrderStatus, PaymentStatus, CardStatus } from "@prisma/client";

// GET /api/admin/dashboard - Get dashboard metrics
export async function GET(request: NextRequest) {
  try {
    const customerDelegate = (prisma as unknown as { customer: { count: (args?: unknown) => Promise<number> } }).customer;
    const { user, error } = await authenticate(request);

    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: error || "Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all metrics in parallel for performance
    const [
      // User metrics
      totalCustomers,
      activeCustomers,
      disabledCustomers,
      
      // Order metrics
      totalOrders,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      ordersThisMonth,
      
      // Revenue metrics
      revenueData,
      revenueThisMonth,
      
      // Card metrics
      totalCards,
      activeCards,
      pendingCards,
      
      // Newsletter metrics
      totalSubscribers,
      activeSubscribers,
      subscribersThisMonth,
      
      // Lead metrics
      totalLeads,
      unreadLeads,
      leadsThisMonth,
      
      // Recent orders
      recentOrders,
      
      // Order status distribution
      ordersByStatus,
      
      // Payment status distribution
      ordersByPayment,
    ] = await Promise.all([
      // Total customers (non-admin users)
      customerDelegate.count(),

      // Active customers
      customerDelegate.count({ where: { isActive: true } }),

      // Disabled customers
      customerDelegate.count({ where: { isActive: false } }),
      
      // Total orders
      prisma.order.count(),
      
      // Pending orders
      prisma.order.count({
        where: { status: OrderStatus.PENDING },
      }),
      
      // Completed orders (delivered)
      prisma.order.count({
        where: { status: OrderStatus.DELIVERED },
      }),
      
      // Cancelled orders
      prisma.order.count({
        where: { status: OrderStatus.CANCELLED },
      }),
      
      // Orders this month
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Total revenue (all time)
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          paymentStatus: PaymentStatus.PAID,
        },
      }),
      
      // Revenue this month
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          paymentStatus: PaymentStatus.PAID,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Total cards
      prisma.card.count(),
      
      // Active cards
      prisma.card.count({
        where: { 
          isActive: true,
          status: CardStatus.ACTIVE,
        },
      }),
      
      // Pending cards
      prisma.card.count({
        where: { status: CardStatus.PENDING },
      }),
      
      // Total newsletter subscribers
      prisma.newsletterSubscriber.count(),
      
      // Active subscribers
      prisma.newsletterSubscriber.count({
        where: { isActive: true },
      }),
      
      // Subscribers this month
      prisma.newsletterSubscriber.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Total leads
      prisma.cardLead.count(),
      
      // Unread leads
      prisma.cardLead.count({
        where: { isRead: false },
      }),
      
      // Leads this month
      prisma.cardLead.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      
      // Recent orders (last 5)
      prisma.order.findMany({
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
      }),
      
      // Orders by status
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
      
      // Orders by payment status
      prisma.order.groupBy({
        by: ["paymentStatus"],
        _count: { paymentStatus: true },
      }),
    ]);

    // Format order status distribution
    const orderStatusDistribution = (ordersByStatus as Array<{ status: string; _count: { status: number } }>).reduce(
      (acc: Record<string, number>, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    // Format payment status distribution
    const paymentStatusDistribution = (ordersByPayment as Array<{ paymentStatus: string; _count: { paymentStatus: number } }>).reduce(
      (acc: Record<string, number>, item) => {
        acc[item.paymentStatus] = item._count.paymentStatus;
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
        total: revenueData._sum.total || 0,
        thisMonth: revenueThisMonth._sum.total || 0,
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
        unread: unreadLeads,
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
