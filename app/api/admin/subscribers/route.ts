import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { checkRateLimit } from "@/lib/rate-limit";
import { Role } from "@prisma/client";

import { z } from "zod";
import { errorResponse, successResponse } from "@/lib/responses";

const subscriberToggleSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  isActive: z.boolean(),
});

// GET /api/admin/subscribers - List all subscribers (Admin only)
export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, 30);
  if (!rl.ok) {
    const res = errorResponse("Too many requests", 429);
    if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
    return res;
  }
  try {
    const { user, error } = await authenticate(request);

    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;
    
    // Filters
    const status = searchParams.get("status"); // active, inactive
    const search = searchParams.get("search");
    const source = searchParams.get("source");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    if (source) {
      where.source = source;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
      ];
    }

    const [subscribers, total, activeCount] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.newsletterSubscriber.count({ where }),
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      subscribers,
      activeCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get subscribers error:", error);
    return errorResponse("Failed to fetch subscribers", 500);
  }
}

// DELETE /api/admin/subscribers - Remove subscriber (Admin only)
export async function DELETE(request: NextRequest) {
  const rl = checkRateLimit(request, 20);
  if (!rl.ok) {
    const res = errorResponse("Too many requests", 429);
    if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
    return res;
  }
  try {
    const { user, error } = await authenticate(request);

    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("Subscriber ID is required", 400);
    }

    await prisma.newsletterSubscriber.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Subscriber removed successfully",
    });
  } catch (error) {
    console.error("Delete subscriber error:", error);
    return errorResponse("Failed to remove subscriber", 500);
  }
}

// PATCH /api/admin/subscribers - Toggle subscriber status (Admin only)
export async function PATCH(request: NextRequest) {
  const rl = checkRateLimit(request, 20);
  if (!rl.ok) {
    const res = errorResponse("Too many requests", 429);
    if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
    return res;
  }
  try {
    const { user, error } = await authenticate(request);

    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const body = await request.json();
    const parsed = subscriberToggleSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e=>e.message).join(", "), 400);
    }
    const { id, isActive } = parsed.data;

    const subscriber = await prisma.newsletterSubscriber.update({
      where: { id },
      data: { isActive },
    });

    return successResponse({
      message: `Subscriber ${isActive ? "activated" : "deactivated"} successfully`,
      subscriber,
    });
  } catch (error) {
    console.error("Update subscriber error:", error);
    return errorResponse("Failed to update subscriber", 500);
  }
}
