/**
 * POST /api/payment/create-razorpay-order
 *
 * DEPRECATED alias for POST /api/payment/order.
 *
 * Kept so any older client or the scripts/test-razorpay-flow.ts harness keeps
 * working. It returns the legacy snake_case field names in addition to the new
 * ones. New code should call /api/payment/order.
 *
 * Note: like the new route, any `amount` in the request body is IGNORED - the
 * price is always read from Order.total in the database.
 */

import { NextRequest, NextResponse } from "next/server";
import { createPaymentOrderSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/responses";
import { authenticate } from "@/lib/auth-middleware";
import { getPaymentAdapterService } from "@/lib/payment-adapter";
import { razorpayDebugger } from "@/lib/razorpay-debug";

export async function POST(request: NextRequest) {
  try {
    // MONEY ROUTE - a verified session is mandatory.
    //
    // proxy.ts gates this path too, but the matcher is a list that can drift.
    // The handler must refuse on its own so the guarantee does not depend on
    // a config file staying in step with this directory.
    const { user } = await authenticate(request);
    if (!user) {
      razorpayDebugger.log('WARN', 'POST /api/payment/create-razorpay-order', 'Rejected: no session');
      return errorResponse("You must be signed in to pay for an order.", 401);
    }

    const body = await request.json();
    const parsed = createPaymentOrderSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((e) => e.message).join(", ");
      razorpayDebugger.log('WARN', 'POST /api/payment/create-razorpay-order', 'Validation failed');
      return errorResponse(errorMsg, 400);
    }

    const { existingOrderId, userEmail, userPhone, userName } = parsed.data;

    const paymentAdapter = getPaymentAdapterService();
    const result = await paymentAdapter.createPaymentOrder({
      existingOrderId,
      userEmail,
      userPhone,
      userName,
    });

    return NextResponse.json({
      success: true,
      // legacy field names
      razorpay_order_id: result.orderId,
      razorpay_key: result.keyId,
      paymentLogId: result.paymentLogId,
      // current field names
      orderId: result.orderId,
      keyId: result.keyId,
      amount: result.amount,
      currency: result.currency,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    razorpayDebugger.log('ERROR', 'POST /api/payment/create-razorpay-order', 'Order creation failed', { error: errorMsg });
    console.error("Create Razorpay order error:", errorMsg);

    return errorResponse(
      error instanceof Error ? error.message : "Failed to create Razorpay order",
      400
    );
  }
}
