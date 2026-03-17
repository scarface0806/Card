import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import { AuthUser } from "@/lib/auth";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// GET /api/admin/orders - Get all orders (Admin only)
async function getOrdersHandler(request: NextRequest, user: AuthUser) {
  const rl = checkRateLimit(request, 50);
  if (!rl.ok) {
    const res = errorResponse("Too many requests", 429);
    if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
    return res;
  }
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    
    // Filters
    const status = searchParams.get("status") as OrderStatus | null;
    const paymentStatus = searchParams.get("paymentStatus") as PaymentStatus | null;
    const userId = searchParams.get("userId");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (userId) {
      where.userId = userId;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { guestEmail: { contains: search, mode: "insensitive" } },
        { guestName: { contains: search, mode: "insensitive" } },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // Build sort
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    const [orders, total, statusCounts] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
      // Get counts by status for dashboard
      prisma.order.groupBy({
        by: ["status"],
        _count: { status: true },
      }),
    ]);

    // Format status counts
    const statusSummary = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        total,
        byStatus: statusSummary,
      },
    });
  } catch (error) {
    console.error("Admin get orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/admin/orders - Create order manually (Admin only)
async function createOrderHandler(request: NextRequest, user: AuthUser) {
  const rl = checkRateLimit(request, 30);
  if (!rl.ok) {
    const res = errorResponse("Too many requests", 429);
    if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
    return res;
  }

  try {
    const body = (await request.json()) as {
      customerId?: string;
      productId?: string;
      quantity?: number;
      price?: number;
      address?: string;
      notes?: string;
    };

    const productId = String(body.productId || "").trim();
    const customerId = String(body.customerId || "").trim();
    const quantity = Number(body.quantity || 1);
    const submittedPrice = Number(body.price || 0);
    const address = String(body.address || "").trim();
    const notes = String(body.notes || "").trim();

    if (!productId || !ObjectId.isValid(productId)) {
      return errorResponse("Valid product is required", 400);
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      return errorResponse("Quantity must be a positive number", 400);
    }

    const db = await getMongoDb();
    const products = db.collection("products");
    const customers = db.collection("customers");
    const orders = db.collection("orders");

    const product = await products.findOne({ _id: new ObjectId(productId) });
    if (!product) {
      return errorResponse("Product not found", 404);
    }

    let customer: Record<string, unknown> | null = null;
    if (customerId) {
      if (!ObjectId.isValid(customerId)) {
        return errorResponse("Invalid customer id", 400);
      }
      customer = (await customers.findOne({ _id: new ObjectId(customerId) })) as Record<string, unknown> | null;
      if (!customer) {
        return errorResponse("Customer not found", 404);
      }
    }

    const unitPrice = Number.isFinite(submittedPrice) && submittedPrice > 0
      ? submittedPrice
      : Number(product.price || 0);

    const total = unitPrice * quantity;
    const now = new Date();
    const orderNumber = generateOrderNumber();

    const insertDoc = {
      orderNumber,
      userId: null,
      guestName: customer ? String(customer.name || "Guest") : "Guest",
      guestEmail: customer ? String(customer.email || "") || null : null,
      guestPhone: customer ? String(customer.phone || "") || null : null,
      designation: customer ? String(customer.designation || "") || null : null,
      company: customer ? String(customer.company || "") || null : null,
      website: customer ? String(customer.website || "") || null : null,
      address: address || (customer ? String(customer.address || "") || null : null),
      cardType: String(product.name || "Product"),
      price: unitPrice,
      templateSlug: null,
      profileData: null,
      items: [
        {
          productId,
          productName: String(product.name || "Product"),
          quantity,
          price: unitPrice,
          total,
        },
      ],
      subtotal: total,
      discount: 0,
      shipping: 0,
      tax: 0,
      total,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: null,
      paymentId: null,
      shippingAddress: null,
      billingAddress: null,
      cardId: null,
      nfcLinkEmailSent: false,
      notes: notes || null,
      createdAt: now,
      updatedAt: now,
    };

    const result = await orders.insertOne(insertDoc);

    return successResponse(
      {
        message: "Order created successfully",
        order: {
          id: String(result.insertedId),
          orderNumber,
          total,
          status: OrderStatus.PENDING,
          createdAt: now,
        },
      },
      201
    );
  } catch (error) {
    console.error("Admin create order error:", error);
    return errorResponse("Failed to create order", 500);
  }
}

export const GET = withAdmin(getOrdersHandler);
export const POST = withAdmin(createOrderHandler);
