import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { Role } from "@prisma/client";

/**
 * GET /api/admin/stats
 * Returns basic statistics for admin dashboard
 * Only accessible to ADMIN users
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error } = await authenticate(request);

    // Check if user is authenticated and has ADMIN role
    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: error || "Admin access required" },
        { status: 403 }
      );
    }

    // Fetch all stats in parallel for performance
    const [totalCustomers, totalOrders, totalCards, totalProducts] = await Promise.all([
      // Total customers (users with CUSTOMER role)
      prisma.user.count({
        where: { role: Role.CUSTOMER },
      }),

      // Total orders
      prisma.order.count(),

      // Total cards
      prisma.card.count(),

      // Total products
      prisma.product.count(),
    ]);

    return NextResponse.json(
      {
        success: true,
        stats: {
          totalCustomers,
          totalOrders,
          totalCards,
          totalProducts,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
