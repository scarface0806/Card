import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { AuthUser } from "@/lib/auth";
import { Role } from "@prisma/client";

// GET /api/admin/customers - Get all customers (admin only)
async function handler(request: NextRequest, user: AuthUser) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get("page") || "1");
    const rawLimit = parseInt(searchParams.get("limit") || "50");
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;
    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: Role.CUSTOMER },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          isActive: true,
          _count: {
            select: {
              orders: true,
              cards: true,
            },
          },
        },
      }),
      prisma.user.count({ where: { role: Role.CUSTOMER } }),
    ]);

    const data = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      createdAt: customer.createdAt,
      isActive: customer.isActive ?? true,
      totalOrders: customer._count.orders,
      totalCards: customer._count.cards,
    }));

    return NextResponse.json({
      customers: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

export const GET = withAdmin(handler);
