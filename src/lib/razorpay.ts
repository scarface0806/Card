/**
 * Razorpay Payment Service Adapter
 * 
 * This is a payment adapter layer that sits between the application
 * and Razorpay payment gateway. It handles:
 * - Creating Razorpay orders
 * - Verifying payment signatures
 * - Mapping between internal order IDs and Razorpay order IDs
 * 
 * ISOLATION PRINCIPLE: This module only handles Razorpay-specific operations
 * and does not modify any existing order or business logic.
 */

import crypto from "crypto";
import { razorpayDebugger } from "./razorpay-debug";

export interface RazorpayOrderParams {
  amount: number; // in paise (100 paise = 1 INR)
  currency?: string;
  receipt?: string;
  notes?: Record<string, any>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: Record<string, any>;
  created_at: number;
}

export interface PaymentVerificationParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Constant-time comparison of two hex-encoded digests.
 *
 * A plain `===` on a signature leaks, through timing, how many leading bytes an
 * attacker got right. Length is compared first because timingSafeEqual throws on
 * mismatched buffer lengths — and length is not secret.
 */
export function timingSafeEqualHex(expected: string, received: string): boolean {
  if (typeof received !== "string" || expected.length !== received.length) {
    return false;
  }

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(received, "hex");

  if (expectedBuf.length === 0 || expectedBuf.length !== receivedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

/**
 * Razorpay Service Class
 * Handles all Razorpay API interactions
 */
class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private apiBaseUrl = "https://api.razorpay.com/v1";

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      const error = "Razorpay credentials not configured. Please set RAZORPAY_KEY_SECRET in environment variables and either RAZORPAY_KEY_ID or NEXT_PUBLIC_RAZORPAY_KEY_ID.";
      razorpayDebugger.log('ERROR', 'RazorpayService', error);
      throw new Error(error);
    }

    // Log trimmed status to check for extra spaces
    if (keyId.trim() !== keyId) {
      razorpayDebugger.log('WARN', 'RazorpayService', 'RAZORPAY_KEY_ID has leading/trailing spaces', { length: keyId.length, trimmedLength: keyId.trim().length });
    }
    
    if (keySecret.trim() !== keySecret) {
      razorpayDebugger.log('WARN', 'RazorpayService', 'RAZORPAY_KEY_SECRET has leading/trailing spaces', { length: keySecret.length, trimmedLength: keySecret.trim().length });
    }

    this.keyId = keyId.trim();
    this.keySecret = keySecret.trim();

    // Log successful initialization
    razorpayDebugger.log('SUCCESS', 'RazorpayService', 'Service initialized', {
      keyIdPrefix: this.keyId.substring(0, 15) + '...',
      mode: process.env.RAZORPAY_MODE || 'test',
    });
  }

  /**
   * Create a Razorpay order
   * @param params Order creation parameters
   * @returns Razorpay order details
   */
  async createOrder(params: RazorpayOrderParams): Promise<RazorpayOrderResponse> {
    try {
      // Razorpay rejects non-integer amounts. Fail loudly here rather than
      // shipping a float to their API and getting an opaque 400 back.
      if (!Number.isSafeInteger(params.amount) || params.amount <= 0) {
        throw new Error("Razorpay amount must be a positive integer in paise");
      }

      const url = `${this.apiBaseUrl}/orders`;
      
      razorpayDebugger.log('INFO', 'RazorpayService.createOrder', 'Creating Razorpay order', {
        amount: params.amount,
        currency: params.currency || 'INR',
        amountInINR: params.amount / 100,
      });

      const body = new URLSearchParams({
        amount: params.amount.toString(),
        currency: params.currency || "INR",
        receipt: params.receipt || `receipt_${Date.now()}`,
        ...(params.notes && { notes: JSON.stringify(params.notes) }),
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.keyId}:${this.keySecret}`).toString(
            "base64"
          )}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!response.ok) {
        const error = await response.json();
        const errorMessage = error.error?.description || "Unknown error";
        razorpayDebugger.log('ERROR', 'RazorpayService.createOrder', `Razorpay API Error: ${errorMessage}`, {
          status: response.status,
          error,
        });
        throw new Error(`Razorpay API Error: ${errorMessage}`);
      }

      const data = await response.json();
      razorpayDebugger.log('SUCCESS', 'RazorpayService.createOrder', 'Order created successfully', {
        orderId: data.id,
        amount: data.amount,
        status: data.status,
      });
      return data as RazorpayOrderResponse;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      razorpayDebugger.log('ERROR', 'RazorpayService.createOrder', 'Order creation failed', { error: errorMsg });
      console.error("Razorpay order creation error:", error);
      throw error;
    }
  }

  /**
   * Verify payment signature
   * This uses Razorpay's signature verification mechanism to ensure the payment
   * is legitimate and hasn't been tampered with.
   * 
   * @param params Payment verification parameters
   * @returns true if signature is valid, false otherwise
   */
  verifyPaymentSignature(params: PaymentVerificationParams): boolean {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;

      // Log identifiers only. The signature itself is secret-derived material
      // and must never reach the logs, not even partially.
      razorpayDebugger.log('INFO', 'RazorpayService.verifyPaymentSignature', 'Verifying payment signature', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });

      // Razorpay signs the literal string `order_id|payment_id` with the key secret.
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;

      const expectedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(body)
        .digest("hex");

      const isValid = timingSafeEqualHex(expectedSignature, razorpay_signature);

      if (isValid) {
        razorpayDebugger.log('SUCCESS', 'RazorpayService.verifyPaymentSignature', 'Signature verified successfully', {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
        });
      } else {
        razorpayDebugger.log('ERROR', 'RazorpayService.verifyPaymentSignature', 'Signature verification failed', {
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
        });
      }

      return isValid;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      razorpayDebugger.log('ERROR', 'RazorpayService.verifyPaymentSignature', 'Signature verification error', { error: errorMsg });
      console.error("Payment signature verification error:", error);
      return false;
    }
  }

  /**
   * Verify webhook signature
   * Ensures webhook calls are from Razorpay and not from unauthorized sources
   * 
   * @param body Raw request body
   * @param signature Signature from X-Razorpay-Signature header
   * @returns true if webhook is authentic
   */
  verifyWebhookSignature(body: string, signature: string): boolean {
    try {
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!webhookSecret) {
        razorpayDebugger.log('WARN', 'RazorpayService.verifyWebhookSignature', 'Webhook secret not configured');
        console.warn("Webhook secret not configured");
        return false;
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret.trim())
        .update(body)
        .digest("hex");

      const isValid = timingSafeEqualHex(expectedSignature, signature);

      if (isValid) {
        razorpayDebugger.log('SUCCESS', 'RazorpayService.verifyWebhookSignature', 'Webhook signature verified');
      } else {
        razorpayDebugger.log('ERROR', 'RazorpayService.verifyWebhookSignature', 'Webhook signature verification failed');
      }

      return isValid;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      razorpayDebugger.log('ERROR', 'RazorpayService.verifyWebhookSignature', 'Webhook verification error', { error: errorMsg });
      console.error("Webhook signature verification error:", error);
      return false;
    }
  }
}

// Singleton instance
let razorpayService: RazorpayService | null = null;

/**
 * Get or create Razorpay service instance
 */
export function getRazorpayService(): RazorpayService {
  if (!razorpayService) {
    razorpayDebugger.log('INFO', 'getRazorpayService', 'Initializing RazorpayService');
    razorpayService = new RazorpayService();
  }
  return razorpayService;
}

export default getRazorpayService;
