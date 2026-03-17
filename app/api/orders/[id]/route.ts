import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { Role, OrderStatus } from "@prisma/client";

import { orderStatusSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import { MongoClient, ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

type RouteParams = { params: Promise<{ id: string }> };

function normalizePatchStatus(status: unknown): OrderStatus | undefined {
  if (typeof status !== "string") {
    return undefined;
  }

  const normalized = status.toUpperCase();
  if (normalized === "PENDING") {
    return OrderStatus.PENDING;
  }
  if (normalized === "ACCEPTED") {
    return OrderStatus.CONFIRMED;
  }
  if (normalized === "PROCESSING") {
    return OrderStatus.PROCESSING;
  }
  if (normalized === "COMPLETED") {
    return OrderStatus.DELIVERED;
  }
  if (normalized === "REJECTED") {
    return OrderStatus.CANCELLED;
  }
  if (normalized === "CANCELLED") {
    return OrderStatus.CANCELLED;
  }

  return Object.values(OrderStatus).includes(normalized as OrderStatus)
    ? (normalized as OrderStatus)
    : undefined;
}

function normalizeStoredOrderStatus(status: unknown): OrderStatus | undefined {
  if (typeof status !== "string") {
    return undefined;
  }

  const normalized = status.toUpperCase();
  if (normalized === "ACCEPTED") return OrderStatus.CONFIRMED;
  if (normalized === "COMPLETED") return OrderStatus.DELIVERED;
  if (normalized === "CANCELLED") return OrderStatus.CANCELLED;
  if (normalized === "PROCESSING") return OrderStatus.PROCESSING;
  if (normalized === "PENDING") return OrderStatus.PENDING;

  return Object.values(OrderStatus).includes(normalized as OrderStatus)
    ? (normalized as OrderStatus)
    : undefined;
}

function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) {
    return true;
  }

  const transitions: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING],
    [OrderStatus.PROCESSING]: [OrderStatus.DELIVERED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.REFUNDED]: [],
  };

  return transitions[from]?.includes(to) ?? false;
}

function statusSuccessMessage(status: OrderStatus): string {
  if (status === OrderStatus.CONFIRMED) return "Order accepted";
  if (status === OrderStatus.PROCESSING) return "Order moved to processing";
  if (status === OrderStatus.DELIVERED) return "Order completed";
  if (status === OrderStatus.CANCELLED) return "Order cancelled";
  return "Order status updated successfully";
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
          message: "Invalid status. Use pending, accepted, processing, completed, or cancelled",
        },
        { status: 400 }
      );
    }

    const successMessage = statusSuccessMessage(normalizedStatus);

    if (ObjectId.isValid(id)) {
      const db = await getMongoDb();
      const orderObjectId = new ObjectId(id);
      const existingMongoOrder = await db.collection("orders").findOne({ _id: orderObjectId });

      if (existingMongoOrder) {
        const currentStatus = normalizeStoredOrderStatus(existingMongoOrder.status);
        if (!currentStatus) {
          return NextResponse.json(
            { success: false, message: "Current order status is invalid" },
            { status: 400 }
          );
        }

        if (!canTransitionOrderStatus(currentStatus, normalizedStatus)) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid status transition from ${currentStatus} to ${normalizedStatus}`,
            },
            { status: 400 }
          );
        }

        const mongoResult = await db.collection("orders").findOneAndUpdate(
          { _id: orderObjectId },
          {
            $set: {
              status: normalizedStatus,
              updatedAt: new Date(),
              createdAt: existingMongoOrder.createdAt || new Date(),
            },
          },
          { returnDocument: "after" }
        );

        return NextResponse.json({
          success: true,
          message: successMessage,
          order: {
            id,
            ...((mongoResult || {}) as Record<string, unknown>),
          },
        });
      }
    }

    const existingOrder = await prisma.order.findUnique({ where: { id } });
    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (!canTransitionOrderStatus(existingOrder.status, normalizedStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Invalid status transition from ${existingOrder.status} to ${normalizedStatus}`,
        },
        { status: 400 }
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
      message: successMessage,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Orders API error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/:id - Delete order (Admin only)
export async function DELETE(
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

    if (!ObjectId.isValid(id)) {
      return errorResponse("Invalid order id", 400);
    }

    const db = await getMongoDb();
    const result = await db.collection("orders").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return errorResponse("Order not found", 404);
    }

    return successResponse({ message: "Order deleted" }, 200);
  } catch (error) {
    console.error("API Error:", error);
    return errorResponse("Failed to delete order", 500);
  }
}
