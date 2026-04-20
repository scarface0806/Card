/**
 * POST /api/payment/create-razorpay-order
 * 
 * Creates a Razorpay order for an existing internal order.
 * This endpoint is part of the isolated Payment Adapter Layer.
 * 
 * Request Body:
 * {
 *   existingOrderId: string (MongoDB ObjectId)
 *   amount?: number (optional, if not provided, fetches from order)
 *   userEmail?: string (optional)
 *   userPhone?: string (optional)
 *   userName?: string (optional)
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   razorpay_order_id: string,
 *   razorpay_key: string,
 *   amount: number (in paise),
 *   currency: "INR",
 *   paymentLogId: string
 * }
 * 
 * Key Features:
 * - Does NOT modify existing order
 * - Reads order data only to fetch amount if not provided
 * - Creates payment log entry mapping internal order to Razorpay order
 * - Completely isolated from core order logic
 */

import { NextRequest, NextResponse } from "next/server";
import { createRazorpayOrderSchema } from "@/lib/validators";
import { errorResponse, successResponse } from "@/lib/responses";
import { getPaymentAdapterService } from "@/lib/payment-adapter";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const parsed = createRazorpayOrderSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues.map((e) => e.message).join(", "),
        400
      );
    }

    const {
      existingOrderId,
      amount,
      userEmail,
      userPhone,
      userName,
    } = parsed.data;

    // Get order to fetch amount if not provided
    const order = await prisma.order.findUnique({
      where: { id: existingOrderId },
      select: {
        id: true,
        total: true,
        guestEmail: true,
        guestName: true,
        guestPhone: true,
      },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    // Use provided amount or fallback to order total
    const orderAmount = amount || order.total;

    if (!orderAmount || orderAmount <= 0) {
      return errorResponse(
        "Invalid amount. Please provide a valid amount or ensure the order has a total.",
        400
      );
    }

    // Create Razorpay order using payment adapter
    const paymentAdapter = getPaymentAdapterService();
    const result = await paymentAdapter.createRazorpayOrder({
      existingOrderId,
      amount: orderAmount,
      userEmail: userEmail || order.guestEmail || undefined,
      userPhone: userPhone || order.guestPhone || undefined,
      userName: userName || order.guestName || undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Create Razorpay order error:", error);

    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }

    return errorResponse("Failed to create Razorpay order", 500);
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
