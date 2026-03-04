import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { Role } from "@prisma/client";
import { errorResponse, successResponse } from "@/lib/responses";

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
      console.warn(`[Admin Stats] Unauthorized access attempt`, { 
        hasUser: !!user, 
        role: user?.role 
      });
      return errorResponse("Admin access required", 403);
    }

    console.info(`[Admin Stats] Fetching statistics for admin: ${user.email}`);

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

    return successResponse({
      stats: {
        totalCustomers,
        totalOrders,
        totalCards,
        totalProducts,
      },
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error("[Admin Stats] Error fetching stats:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    return errorResponse("Failed to fetch statistics. Please try again.", 500);
  }
}
