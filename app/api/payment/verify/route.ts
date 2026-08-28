/**
 * POST /api/payment/verify
 *
 * Verifies a Razorpay payment and fulfils the order.
 *
 * Request Body:
 * {
 *   existingOrderId: string,
 *   razorpayPaymentId: string,
 *   razorpayOrderId: string,
 *   razorpaySignature: string
 * }
 *
 * Response:
 * {
 *   success: true/false,
 *   message: string,
 *   paymentId?: string
 * }
 *
 * SECURITY
 * - The signature is recomputed server-side as HMAC-SHA256(`order_id|payment_id`)
 *   with RAZORPAY_KEY_SECRET and compared with crypto.timingSafeEqual. The
 *   browser handler callback alone never marks anything paid.
 * - Fulfilment is idempotent on razorpay_payment_id, so a replayed request
 *   cannot fulfil the same order twice.
 * - Logs carry order/payment identifiers only - never the request body,
 *   the signature, or customer PII.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/responses";
import { getPaymentAdapterService } from "@/lib/payment-adapter";
import { razorpayDebugger } from "@/lib/razorpay-debug";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((e) => e.message).join(", ");
      razorpayDebugger.log('WARN', 'POST /api/payment/verify', 'Validation failed');
      return errorResponse(errorMsg, 400);
    }

    const {
      existingOrderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = parsed.data;

    razorpayDebugger.log('INFO', 'POST /api/payment/verify', 'Verification request received', {
      existingOrderId,
      razorpayOrderId,
      razorpayPaymentId,
    });

    const paymentAdapter = getPaymentAdapterService();
    const result = await paymentAdapter.verifyPayment({
      existingOrderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    razorpayDebugger.log('ERROR', 'POST /api/payment/verify', 'Verification error', { error: errorMsg });
    console.error("Verify payment error:", errorMsg);

    // Deliberately generic: never leak internal state on the verification path.
    return errorResponse("Failed to verify payment", 500);
  }
}
