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
 * Razorpay Service Class
 * Handles all Razorpay API interactions
 */
class RazorpayService {
  private keyId: string;
  private keySecret: string;
  private apiBaseUrl = "https://api.razorpay.com/v1";

  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables."
      );
    }

    this.keyId = keyId;
    this.keySecret = keySecret;
  }

  /**
   * Create a Razorpay order
   * @param params Order creation parameters
   * @returns Razorpay order details
   */
  async createOrder(params: RazorpayOrderParams): Promise<RazorpayOrderResponse> {
    try {
      const url = `${this.apiBaseUrl}/orders`;

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
        throw new Error(`Razorpay API Error: ${error.error?.description || "Unknown error"}`);
      }

      const data = await response.json();
      return data as RazorpayOrderResponse;
    } catch (error) {
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

      // Create the signature body: order_id|payment_id
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac("sha256", this.keySecret)
        .update(body)
        .digest("hex");

      // Compare signatures
      return expectedSignature === razorpay_signature;
    } catch (error) {
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
        console.warn("Webhook secret not configured");
        return false;
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      return expectedSignature === signature;
    } catch (error) {
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
    razorpayService = new RazorpayService();
  }
  return razorpayService;
}

export default getRazorpayService;
