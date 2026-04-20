/**
 * POST /api/payment/verify
 * 
 * Verifies a Razorpay payment and updates the payment log.
 * This endpoint is part of the isolated Payment Adapter Layer.
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
 * Key Features:
 * - Verifies payment signature using Razorpay's HMAC
 * - Updates PaymentLog with SUCCESS or FAILED status
 * - Does NOT modify the original order
 * - Returns payment status for frontend to handle next steps
 * 
 * Flow:
 * 1. Receive payment details from frontend
 * 2. Verify signature is authentic
 * 3. Update payment log in database
 * 4. Return success/failure response
 * 5. Frontend can then optionally update order status or send confirmation email
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyPaymentSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/responses";
import { getPaymentAdapterService } from "@/lib/payment-adapter";
import { razorpayDebugger } from "@/lib/razorpay-debug";

export async function POST(request: NextRequest) {
  try {
    razorpayDebugger.log('INFO', 'POST /api/payment/verify', 'Payment verification request received');

    // Parse and validate request body
    const body = await request.json();
    razorpayDebugger.log('INFO', 'POST /api/payment/verify', 'Request body parsed', {
      existingOrderId: body.existingOrderId,
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
    });

    const parsed = verifyPaymentSchema.safeParse(body);

    if (!parsed.success) {
      const errorMsg = parsed.error.issues.map((e) => e.message).join(", ");
      razorpayDebugger.log('WARN', 'POST /api/payment/verify', 'Validation failed', { errors: parsed.error.issues });
      return errorResponse(errorMsg, 400);
    }

    const {
      existingOrderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = parsed.data;

    razorpayDebugger.log('INFO', 'POST /api/payment/verify', 'Starting payment verification', {
      existingOrderId,
      razorpayOrderId,
      razorpayPaymentId,
    });

    // Verify payment using payment adapter
    const paymentAdapter = getPaymentAdapterService();
    const result = await paymentAdapter.verifyPayment({
      existingOrderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    });

    if (result.success) {
      razorpayDebugger.log('SUCCESS', 'POST /api/payment/verify', 'Payment verification successful', {
        paymentId: result.paymentId,
      });
    } else {
      razorpayDebugger.log('WARN', 'POST /api/payment/verify', 'Payment verification failed', {
        message: result.message,
      });
    }

    return NextResponse.json(result, {
      status: result.success ? 200 : 400,
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    razorpayDebugger.log('ERROR', 'POST /api/payment/verify', 'Verification error', { error: errorMsg });
    console.error("Verify payment error:", error);

    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }

    return errorResponse("Failed to verify payment", 500);
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
