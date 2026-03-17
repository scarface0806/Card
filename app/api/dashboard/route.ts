import type { NextRequest } from "next/server";
import { authenticate } from "@/lib/auth-middleware";
import { getMongoDb } from "@/lib/mongodb";
import { errorResponse } from "@/lib/responses";
import { successResponse } from "@/lib/responses";

const COMPLETED_STATUSES = ["DELIVERED", "COMPLETED", "completed"];
const PENDING_STATUSES = ["PENDING", "pending"];

const REVENUE_FIELD = {
  $ifNull: ["$totalAmount", { $ifNull: ["$total", 0] }],
};

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (!user || user.role !== "ADMIN") {
      return errorResponse(error || "Admin access required", 403);
    }

    const db = await getMongoDb();

    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalOrders, totalCustomers, completedOrders, pendingOrders, totalRevenueAgg, todayRevenueAgg, monthlyRevenueAgg] = await Promise.all([
      db.collection("orders").countDocuments({}),
      db.collection("customers").countDocuments({}),
      db.collection("orders").countDocuments({ status: { $in: COMPLETED_STATUSES } }),
      db.collection("orders").countDocuments({ status: { $in: PENDING_STATUSES } }),
      db
        .collection("orders")
        .aggregate([
          {
            $match: {
              status: { $in: COMPLETED_STATUSES },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: REVENUE_FIELD },
            },
          },
        ])
        .toArray(),
      db
        .collection("orders")
        .aggregate([
          {
            $match: {
              status: { $in: COMPLETED_STATUSES },
              createdAt: { $gte: startOfToday },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: REVENUE_FIELD },
            },
          },
        ])
        .toArray(),
      db
        .collection("orders")
        .aggregate([
          {
            $match: {
              status: { $in: COMPLETED_STATUSES },
              createdAt: { $gte: startOfMonth },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: REVENUE_FIELD },
            },
          },
        ])
        .toArray(),
    ]);

    const totalRevenue = Number(totalRevenueAgg?.[0]?.total || 0);
    const todayRevenue = Number(todayRevenueAgg?.[0]?.total || 0);
    const monthlyRevenue = Number(monthlyRevenueAgg?.[0]?.total || 0);
    const earnings = totalRevenue;

    return successResponse({
      totalOrders,
      totalCustomers,
      completedOrders,
      pendingOrders,
      totalRevenue,
      todayRevenue,
      monthlyRevenue,
      earnings,
    });
  } catch (error) {
    console.error("Orders API error:", error);
    return errorResponse("Failed to fetch dashboard metrics", 500);
  }
}
