import type { NextRequest } from "next/server";
import { authenticate } from "@/lib/auth-middleware";
import { getMongoDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/responses";
import { successResponse } from "@/lib/responses";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (!user || user.role !== "ADMIN") {
      return errorResponse(error || "Admin access required", 403);
    }

    const db = await getMongoDb();

    const [totalOrders, totalCustomers, revenueAgg] = await Promise.all([
      db.collection("orders").countDocuments({}),
      db.collection("customers").countDocuments({}),
      db
        .collection("orders")
        .aggregate([
          {
            $match: {
              status: { $in: ["DELIVERED", "COMPLETED", "completed"] },
            },
          },
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $ifNull: ["$totalAmount", { $ifNull: ["$total", 0] }],
                },
              },
            },
          },
        ])
        .toArray(),
    ]);

    const totalRevenue = Number(revenueAgg?.[0]?.total || 0);
    const earnings = totalRevenue;

    return successResponse({
      totalOrders,
      totalCustomers,
      totalRevenue,
      earnings,
    });
  } catch (error) {
    console.error("API Error:", error);
    return errorResponse("Failed to fetch dashboard metrics", 500);
  }
}
