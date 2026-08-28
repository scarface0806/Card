/**
 * Payment Adapter Layer Service
 *
 * This service handles the mapping between internal orders and Razorpay orders.
 * It maintains the separation between core order logic and payment processing.
 *
 * Key principles:
 * - The order amount is ALWAYS read from the database, never from the client
 * - Payments are tracked in the separate PaymentLog table
 * - Fulfilment is idempotent on razorpay_payment_id, so a replayed verify call
 *   cannot fulfil the same order twice
 * - Logs carry identifiers only (order id / payment id) - never PII, card data
 *   or signature material
 */

import prisma from "@/lib/prisma";
import { getRazorpayService } from "@/lib/razorpay";
import { razorpayDebugger } from "@/lib/razorpay-debug";
import { toPaise, InvalidAmountError } from "@/lib/payment-amount";

export interface CreatePaymentParams {
  existingOrderId: string;
  userEmail?: string;
  userPhone?: string;
  userName?: string;
}

export interface VerifyPaymentParams {
  existingOrderId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}

export interface CreatePaymentResult {
  orderId: string;
  amount: number; // paise
  currency: string;
  keyId: string;
  paymentLogId: string;
}

export interface VerifyPaymentResult {
  success: boolean;
  message: string;
  paymentId?: string;
  /** true when this payment_id had already been fulfilled - no double fulfilment happened */
  alreadyFulfilled?: boolean;
}

export interface PaymentStatusResult {
  success: boolean;
  paymentId?: string;
  message: string;
}

/**
 * Payment Adapter Service
 * Handles payment creation and verification
 */
class PaymentAdapterService {
  /**
   * Create a Razorpay order for an existing internal order.
   *
   * Flow:
   * 1. Read the internal order - the price comes from Order.total in the DB
   * 2. Convert to integer paise
   * 3. Create the Razorpay order
   * 4. Log the mapping in PaymentLog
   *
   * NOTE: no `amount` is accepted from the caller. Any client-supplied amount is
   * ignored by design, so a tampered request cannot buy a 599 rupee card for 1 rupee.
   */
  async createPaymentOrder(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const { existingOrderId, userEmail, userPhone, userName } = params;

    razorpayDebugger.log('INFO', 'PaymentAdapter.createPaymentOrder', 'Starting payment order creation', {
      existingOrderId,
    });

    // Step 1: Read the authoritative amount from our own database.
    const order = await prisma.order.findUnique({
      where: { id: existingOrderId },
      select: {
        id: true,
        total: true,
        paymentStatus: true,
        guestEmail: true,
        guestName: true,
        guestPhone: true,
      },
    });

    if (!order) {
      razorpayDebugger.log('ERROR', 'PaymentAdapter.createPaymentOrder', 'Order not found', { existingOrderId });
      throw new Error(`Order not found: ${existingOrderId}`);
    }

    if (order.paymentStatus === "PAID") {
      razorpayDebugger.log('WARN', 'PaymentAdapter.createPaymentOrder', 'Order already paid', { existingOrderId });
      throw new Error("This order has already been paid");
    }

    // Step 2: Validate and convert to paise.
    let amountInPaise: number;
    try {
      amountInPaise = toPaise(order.total);
    } catch (error) {
      if (error instanceof InvalidAmountError) {
        razorpayDebugger.log('ERROR', 'PaymentAdapter.createPaymentOrder', 'Invalid order total', {
          existingOrderId,
          reason: error.message,
        });
        throw new Error(`Invalid order amount: ${error.message}`);
      }
      throw error;
    }

    const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    if (!publicKeyId) {
      throw new Error(
        "Razorpay public key not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID in your environment."
      );
    }

    // Step 3: Create the Razorpay order.
    const razorpayService = getRazorpayService();
    const razorpayOrder = await razorpayService.createOrder({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${existingOrderId}`.slice(0, 40), // Razorpay caps receipt at 40 chars
      notes: {
        orderId: existingOrderId,
      },
    });

    razorpayDebugger.log('SUCCESS', 'PaymentAdapter.createPaymentOrder', 'Razorpay order created', {
      existingOrderId,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
    });

    // Step 4: Log the mapping. Contact details are stored (we need them to
    // reconcile a payment) but are never written to the debug log.
    const paymentLog = await prisma.paymentLog.create({
      data: {
        existingOrderId,
        razorpayOrderId: razorpayOrder.id,
        amount: order.total,
        currency: "INR",
        status: "PENDING",
        userEmail: userEmail || order.guestEmail,
        userPhone: userPhone || order.guestPhone,
        userName: userName || order.guestName,
      },
    });

    razorpayDebugger.log('SUCCESS', 'PaymentAdapter.createPaymentOrder', 'Payment log created', {
      paymentLogId: paymentLog.id,
      razorpayOrderId: razorpayOrder.id,
    });

    // SECURITY: only the PUBLIC key id leaves the server. RAZORPAY_KEY_SECRET
    // is never part of any response body.
    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: publicKeyId,
      paymentLogId: paymentLog.id,
    };
  }

  /**
   * Verify a payment signature and fulfil the order exactly once.
   *
   * The browser handler callback is treated as untrusted input: nothing is
   * marked paid until the HMAC recomputed with RAZORPAY_KEY_SECRET matches.
   *
   * Idempotency: razorpay_payment_id is the key. Replaying the same verify call
   * returns success without fulfilling a second time; a *different* payment id
   * against an already-paid order is rejected.
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const {
      existingOrderId,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = params;

    razorpayDebugger.log('INFO', 'PaymentAdapter.verifyPayment', 'Starting payment verification', {
      existingOrderId,
      razorpayOrderId,
      razorpayPaymentId,
    });

    // Step 1: The Razorpay order must be one we created, for this order.
    const paymentLog = await prisma.paymentLog.findUnique({
      where: { razorpayOrderId },
    });

    if (!paymentLog) {
      razorpayDebugger.log('WARN', 'PaymentAdapter.verifyPayment', 'No payment log for razorpay order', {
        razorpayOrderId,
      });
      return { success: false, message: "Payment verification failed" };
    }

    if (paymentLog.existingOrderId !== existingOrderId) {
      razorpayDebugger.log('WARN', 'PaymentAdapter.verifyPayment', 'Payment log belongs to a different order', {
        razorpayOrderId,
        existingOrderId,
      });
      return { success: false, message: "Payment verification failed" };
    }

    // Step 2: Idempotency check before doing any work.
    if (paymentLog.status === "SUCCESS") {
      if (paymentLog.razorpayPaymentId === razorpayPaymentId) {
        razorpayDebugger.log('INFO', 'PaymentAdapter.verifyPayment', 'Replay of an already-verified payment', {
          razorpayOrderId,
          razorpayPaymentId,
        });
        return {
          success: true,
          message: "Payment already verified",
          paymentId: razorpayPaymentId,
          alreadyFulfilled: true,
        };
      }

      razorpayDebugger.log('WARN', 'PaymentAdapter.verifyPayment', 'Different payment id against a paid order', {
        razorpayOrderId,
        razorpayPaymentId,
      });
      return { success: false, message: "This order has already been paid" };
    }

    // Step 3: Recompute the HMAC. Nothing below this line runs on an invalid signature.
    const razorpayService = getRazorpayService();
    const isSignatureValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    });

    if (!isSignatureValid) {
      razorpayDebugger.log('WARN', 'PaymentAdapter.verifyPayment', 'Signature invalid, marking payment log FAILED', {
        razorpayOrderId,
        razorpayPaymentId,
      });

      await prisma.paymentLog.updateMany({
        where: { id: paymentLog.id, status: { not: "SUCCESS" } },
        data: { status: "FAILED", razorpayPaymentId },
      });

      return { success: false, message: "Payment verification failed" };
    }

    // Step 4: Claim the fulfilment. The `status: { not: "SUCCESS" }` filter makes
    // this a compare-and-set: two concurrent verify calls, only one claim wins.
    const claimed = await prisma.paymentLog.updateMany({
      where: { id: paymentLog.id, status: { not: "SUCCESS" } },
      data: {
        status: "SUCCESS",
        razorpayPaymentId,
        razorpaySignature,
      },
    });

    if (claimed.count === 0) {
      razorpayDebugger.log('INFO', 'PaymentAdapter.verifyPayment', 'Fulfilment already claimed concurrently', {
        razorpayOrderId,
        razorpayPaymentId,
      });
      return {
        success: true,
        message: "Payment already verified",
        paymentId: razorpayPaymentId,
        alreadyFulfilled: true,
      };
    }

    // Step 5: Mark the order paid. Also guarded, so re-running is a no-op.
    await prisma.order.updateMany({
      where: { id: existingOrderId, paymentStatus: { not: "PAID" } },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "razorpay",
        paymentId: razorpayPaymentId,
      },
    });

    razorpayDebugger.log('SUCCESS', 'PaymentAdapter.verifyPayment', 'Payment verified and order fulfilled', {
      existingOrderId,
      razorpayOrderId,
      razorpayPaymentId,
    });

    return {
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpayPaymentId,
      alreadyFulfilled: false,
    };
  }

  /**
   * Get payment log for an order
   * Useful for checking payment status
   */
  async getPaymentLog(existingOrderId: string) {
    try {
      const paymentLog = await prisma.paymentLog.findFirst({
        where: {
          existingOrderId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return paymentLog;
    } catch (error) {
      console.error("Get payment log error:", error);
      throw error;
    }
  }

  async checkCapturedPayment(params: {
    existingOrderId: string;
    razorpayOrderId: string;
    razorpayQrCodeId: string;
  }): Promise<PaymentStatusResult> {
    const paymentLog = await prisma.paymentLog.findUnique({
      where: { razorpayOrderId: params.razorpayOrderId },
    });

    if (!paymentLog || paymentLog.existingOrderId !== params.existingOrderId) {
      return { success: false, message: "Payment status unavailable" };
    }

    if (paymentLog.razorpayQrCodeId !== params.razorpayQrCodeId) {
      return { success: false, message: "Payment status unavailable" };
    }

    if (paymentLog.status === "SUCCESS" && paymentLog.razorpayPaymentId) {
      return { success: true, paymentId: paymentLog.razorpayPaymentId, message: "Payment confirmed" };
    }

    const capturedPayment = (await getRazorpayService().getQrCodePayments(params.razorpayQrCodeId))
      .find((payment) =>
        payment.status === "captured" &&
        payment.amount === toPaise(paymentLog.amount) &&
        payment.currency === paymentLog.currency
      );

    if (!capturedPayment) {
      return { success: false, message: "Payment is still pending" };
    }

    const claimed = await prisma.paymentLog.updateMany({
      where: { id: paymentLog.id, status: { not: "SUCCESS" } },
      data: { status: "SUCCESS", razorpayPaymentId: capturedPayment.id },
    });

    await prisma.order.updateMany({
      where: { id: params.existingOrderId, paymentStatus: { not: "PAID" } },
      data: {
        paymentStatus: "PAID",
        paymentMethod: "razorpay_upi",
        paymentId: capturedPayment.id,
      },
    });

    return {
      success: true,
      paymentId: capturedPayment.id,
      message: claimed.count ? "Payment confirmed" : "Payment already confirmed",
    };
  }

  async attachQrCode(paymentLogId: string, razorpayQrCodeId: string): Promise<void> {
    await prisma.paymentLog.updateMany({
      where: { id: paymentLogId, status: "PENDING", razorpayQrCodeId: null },
      data: { razorpayQrCodeId },
    });
  }
}

// Singleton instance
let paymentAdapterService: PaymentAdapterService | null = null;

/**
 * Get or create Payment Adapter Service instance
 */
export function getPaymentAdapterService(): PaymentAdapterService {
  if (!paymentAdapterService) {
    razorpayDebugger.log('INFO', 'getPaymentAdapterService', 'Initializing PaymentAdapterService');
    paymentAdapterService = new PaymentAdapterService();
  }
  return paymentAdapterService;
}

export default getPaymentAdapterService;
