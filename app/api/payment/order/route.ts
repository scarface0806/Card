/**
 * POST /api/payment/order
 *
 * Creates a Razorpay order for an existing internal order.
 *
 * Request Body:
 * {
 *   existingOrderId: string (MongoDB ObjectId)
 *   userEmail?: string
 *   userPhone?: string
 *   userName?: string
 * }
 *
 * Response:
 * {
 *   success: true,
 *   orderId: string,   // Razorpay order id, passed to Checkout as order_id
 *   amount: number,    // integer paise
 *   currency: "INR",
 *   keyId: string      // PUBLIC key id only
 * }
 *
 * SECURITY
 * - The amount is read from Order.total in the database. Any `amount` in the
 *   request body is ignored, so the price cannot be tampered with client-side.
 * - Only the public key id is returned. RAZORPAY_KEY_SECRET never leaves the server.
 * - Logs carry order/payment identifiers only - no request bodies, no PII.
 */

import { NextRequest, NextResponse } from "next/server";
import { createPaymentOrderSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/responses";
import { getPaymentAdapterService } from "@/lib/payment-adapter";
import { razorpayDebugger } from "@/lib/razorpay-debug";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createPaymentOrderSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((e) => e.message).join(", ");
      razorpayDebugger.log('WARN', 'POST /api/payment/order', 'Validation failed');
      return errorResponse(errorMsg, 400);
    }

    const { existingOrderId, userEmail, userPhone, userName } = parsed.data;

    razorpayDebugger.log('INFO', 'POST /api/payment/order', 'Creating payment order', { existingOrderId });

    const paymentAdapter = getPaymentAdapterService();
    const result = await paymentAdapter.createPaymentOrder({
      existingOrderId,
      userEmail,
      userPhone,
      userName,
    });

    razorpayDebugger.log('SUCCESS', 'POST /api/payment/order', 'Payment order created', {
      existingOrderId,
      razorpayOrderId: result.orderId,
    });

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      amount: result.amount,
      currency: result.currency,
      keyId: result.keyId,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    razorpayDebugger.log('ERROR', 'POST /api/payment/order', 'Order creation failed', { error: errorMsg });
    console.error("Create payment order error:", errorMsg);

    return errorResponse(
      error instanceof Error ? error.message : "Failed to create payment order",
      400
    );
  }
}
