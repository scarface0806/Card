import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { Role, OrderStatus } from "@prisma/client";

import { orderStatusSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import { MongoClient, ObjectId } from "mongodb";

type RouteParams = { params: Promise<{ id: string }> };

function normalizePatchStatus(status: unknown): OrderStatus | undefined {
  if (typeof status !== "string") {
    return undefined;
  }

  const normalized = status.toUpperCase();
  if (normalized === "ACCEPTED") {
    return OrderStatus.CONFIRMED;
  }
  if (normalized === "REJECTED") {
    return OrderStatus.CANCELLED;
  }

  return Object.values(OrderStatus).includes(normalized as OrderStatus)
    ? (normalized as OrderStatus)
    : undefined;
}

function isReplicaSetRequiredError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2031"
  );
}

function getDatabaseNameFromUri(uri: string) {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\//, "").trim();
    return pathname || "tapvyo-nfc";
  } catch {
    return "tapvyo-nfc";
  }
}

// GET /api/orders/:id - Get single order
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const rateCheck = checkRateLimit(request, 60);
    if (!rateCheck.ok) {
      const res = errorResponse("Too many requests", 429);
      if (rateCheck.retryAfter) res.headers.set("Retry-After", String(rateCheck.retryAfter));
      return res;
    }
    const { user, error } = await authenticate(request);
    const { id } = await params;

    if (!user) {
      return errorResponse(error || "Unauthorized", 401);
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    // Users can only view their own orders (unless admin)
    if (user.role !== Role.ADMIN && order.userId !== user.id) {
      return errorResponse("Access denied", 403);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    return errorResponse("Failed to fetch order", 500);
  }
}

// PUT /api/orders/:id - Update order (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const rl = checkRateLimit(request, 30);
    if (!rl.ok) {
      const res = errorResponse("Too many requests", 429);
      if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
      return res;
    }
    const { user, error } = await authenticate(request);
    const { id } = await params;

    // Get request body
    const body = await request.json();
    const parsed = orderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e => e.message).join(", "), 400);
    }
    const { status } = parsed.data;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
    });

    if (!existingOrder) {
      return errorResponse("Order not found", 404);
    }

    // ownership: admin or owner allowed
    const isAdmin = user && user.role === Role.ADMIN;
    const isOwner = user && existingOrder.userId === user.id;
    if (!isAdmin && !isOwner) {
      return errorResponse("Access denied", 403);
    }

    // Update order
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return successResponse({
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order error:", error);
    return errorResponse("Failed to update order", 500);
  }
}

// PATCH /api/orders/:id - Update order status (Admin only)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const rl = checkRateLimit(request, 30);
    if (!rl.ok) {
      const res = errorResponse("Too many requests", 429);
      if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
      return res;
    }

    const { user, error } = await authenticate(request);
    const { id } = await params;

    if (!user) {
      return errorResponse(error || "Unauthorized", 401);
    }

    if (user.role !== Role.ADMIN) {
      return errorResponse("Admin access required", 403);
    }

    const body = await request.json();
    const normalizedStatus = normalizePatchStatus(body?.status);

    if (!normalizedStatus) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid status. Use PENDING, ACCEPTED, or REJECTED",
        },
        { status: 400 }
      );
    }

    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    let updatedOrder: unknown;

    try {
      updatedOrder = await prisma.order.update({
        where: { id },
        data: { status: normalizedStatus },
      });
    } catch (error) {
      if (!isReplicaSetRequiredError(error)) {
        throw error;
      }

      if (!ObjectId.isValid(id)) {
        return NextResponse.json(
          { success: false, message: "Order not found" },
          { status: 404 }
        );
      }

      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        throw new Error("DATABASE_URL is not configured");
      }

      const client = new MongoClient(databaseUrl);
      const dbName = getDatabaseNameFromUri(databaseUrl);

      try {
        await client.connect();
        const db = client.db(dbName);
        const orders = db.collection("orders");
        const orderObjectId = new ObjectId(id);

        const result = await orders.findOneAndUpdate(
          { _id: orderObjectId },
          { $set: { status: normalizedStatus, updatedAt: new Date() } },
          { returnDocument: "after" }
        );

        if (!result) {
          return NextResponse.json(
            { success: false, message: "Order not found" },
            { status: 404 }
          );
        }

        updatedOrder = {
          id,
          ...result,
        };
      } finally {
        await client.close();
      }
    }

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Patch order error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 500 }
    );
  }
}
