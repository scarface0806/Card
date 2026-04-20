/**
 * Payment Adapter Layer Service
 * 
 * This service handles the mapping between internal orders and Razorpay orders.
 * It maintains the separation between core order logic and payment processing.
 * 
 * Key principles:
 * - Does NOT modify existing orders
 * - Only reads order data (fetch-only)
 * - Tracks payments in separate PaymentLog table
 * - Can be completely removed without affecting core system
 */

import prisma from "@/lib/prisma";
import { getRazorpayService, PaymentVerificationParams } from "@/lib/razorpay";
import { razorpayDebugger } from "@/lib/razorpay-debug";

export interface CreatePaymentParams {
  existingOrderId: string;
  amount: number; // in INR (not paise)
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

/**
 * Payment Adapter Service
 * Handles payment creation and verification
 */
class PaymentAdapterService {
  /**
   * Create a new Razorpay order for an existing internal order
   * 
   * Flow:
   * 1. Fetch existing order (read-only, no modification)
   * 2. Create Razorpay order
   * 3. Log payment mapping in PaymentLog
   * 4. Return Razorpay order details
   * 
   * @param params Payment creation parameters
   * @returns Razorpay order response
   */
  async createRazorpayOrder(params: CreatePaymentParams) {
    try {
      const { existingOrderId, amount, userEmail, userPhone, userName } = params;

      razorpayDebugger.log('INFO', 'PaymentAdapter.createRazorpayOrder', 'Starting payment order creation', {
        existingOrderId,
        amount,
        userEmail,
      });

      // Step 1: Verify order exists (read-only, no modification)
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
        razorpayDebugger.log('ERROR', 'PaymentAdapter.createRazorpayOrder', `Order not found: ${existingOrderId}`);
        throw new Error(`Order not found: ${existingOrderId}`);
      }

      razorpayDebugger.log('SUCCESS', 'PaymentAdapter.createRazorpayOrder', 'Order found', {
        orderId: order.id,
        orderTotal: order.total,
      });

      // Step 2: Create Razorpay order
      const razorpayService = getRazorpayService();
      const razorpayOrder = await razorpayService.createOrder({
        amount: Math.round(amount * 100), // Convert to paise
        currency: "INR",
        receipt: `order_${existingOrderId}_${Date.now()}`,
        notes: {
          orderId: existingOrderId,
          email: userEmail || order.guestEmail,
          phone: userPhone || order.guestPhone,
          name: userName || order.guestName,
        },
      });

      razorpayDebugger.log('SUCCESS', 'PaymentAdapter.createRazorpayOrder', 'Razorpay order created', {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
      });

      // Step 3: Log payment mapping
      const paymentLog = await prisma.paymentLog.create({
        data: {
          existingOrderId,
          razorpayOrderId: razorpayOrder.id,
          amount,
          currency: "INR",
          status: "PENDING",
          userEmail: userEmail || order.guestEmail,
          userPhone: userPhone || order.guestPhone,
          userName: userName || order.guestName,
          metadata: {
            razorpayResponse: JSON.parse(JSON.stringify(razorpayOrder)),
          },
        },
      });

      razorpayDebugger.log('SUCCESS', 'PaymentAdapter.createRazorpayOrder', 'Payment log created', {
        paymentLogId: paymentLog.id,
        status: paymentLog.status,
      });

      // Step 4: Return response
      // SECURITY NOTE: Return only the PUBLIC key to frontend
      // Never expose RAZORPAY_KEY_SECRET
      const publicKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
      
      if (!publicKeyId) {
        throw new Error("Razorpay public key not configured. Please set NEXT_PUBLIC_RAZORPAY_KEY_ID or RAZORPAY_KEY_ID in environment variables.");
      }

      return {
        success: true,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key: publicKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        paymentLogId: paymentLog.id,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      razorpayDebugger.log('ERROR', 'PaymentAdapter.createRazorpayOrder', 'Payment order creation failed', { error: errorMsg });
      console.error("Payment creation error:", error);
      throw error;
    }
  }

  /**
   * Verify payment signature and update payment log
   * 
   * This does NOT modify the original order. It only:
   * 1. Verifies the payment signature
   * 2. Updates the PaymentLog table
   * 3. Returns success/failure status
   * 
   * @param params Payment verification parameters
   * @returns Verification result
   */
  async verifyPayment(params: VerifyPaymentParams) {
    try {
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

      // Step 1: Verify signature
      const razorpayService = getRazorpayService();
      const isSignatureValid = razorpayService.verifyPaymentSignature({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      });

      if (!isSignatureValid) {
        razorpayDebugger.log('WARN', 'PaymentAdapter.verifyPayment', 'Signature validation failed, updating payment log with FAILED status');
        
        // Update payment log with failed status
        await prisma.paymentLog.updateMany({
          where: {
            existingOrderId,
            razorpayOrderId,
          },
          data: {
            status: "FAILED",
            razorpayPaymentId,
            razorpaySignature,
          },
        });

        return {
          success: false,
          message: "Payment verification failed",
        };
      }

      razorpayDebugger.log('SUCCESS', 'PaymentAdapter.verifyPayment', 'Signature validation successful, updating payment log with SUCCESS status');

      // Step 2: Update payment log with success
      const updatedPayment = await prisma.paymentLog.updateMany({
        where: {
          existingOrderId,
          razorpayOrderId,
        },
        data: {
          status: "SUCCESS",
          razorpayPaymentId,
          razorpaySignature,
          updatedAt: new Date(),
        },
      });

      razorpayDebugger.log('SUCCESS', 'PaymentAdapter.verifyPayment', 'Payment verification completed successfully', {
        paymentId: razorpayPaymentId,
        updatedRecords: updatedPayment.count,
      });

      return {
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpayPaymentId,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      razorpayDebugger.log('ERROR', 'PaymentAdapter.verifyPayment', 'Payment verification error', { error: errorMsg });
      console.error("Payment verification error:", error);
      throw error;
    }
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
