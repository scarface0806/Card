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
        throw new Error(`Order not found: ${existingOrderId}`);
      }

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
            razorpayResponse: razorpayOrder,
          },
        },
      });

      // Step 4: Return response
      return {
        success: true,
        razorpay_order_id: razorpayOrder.id,
        razorpay_key: process.env.RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        paymentLogId: paymentLog.id,
      };
    } catch (error) {
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

      // Step 1: Verify signature
      const razorpayService = getRazorpayService();
      const isSignatureValid = razorpayService.verifyPaymentSignature({
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      });

      if (!isSignatureValid) {
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

      return {
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpayPaymentId,
      };
    } catch (error) {
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
    paymentAdapterService = new PaymentAdapterService();
  }
  return paymentAdapterService;
}

export default getPaymentAdapterService;
