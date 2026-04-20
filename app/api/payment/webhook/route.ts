/**
 * POST /api/payment/webhook
 * 
 * Razorpay webhook handler for payment events.
 * This endpoint handles events sent by Razorpay servers directly to our backend.
 * 
 * Webhook Configuration:
 * - URL: https://yourdomain.com/api/payment/webhook
 * - Events: payment.authorized, payment.failed, order.paid
 * 
 * Request Headers:
 * - X-Razorpay-Signature: HMAC SHA256 signature of request body
 * 
 * Request Body (for payment.authorized event):
 * {
 *   event: "payment.authorized",
 *   created_at: number,
 *   payload: {
 *     payment: {
 *       entity: "payment",
 *       id: "pay_xxxxx",
 *       order_id: "order_xxxxx",
 *       amount: 50000,
 *       currency: "INR",
 *       status: "authorized",
 *       description: "Payment for order",
 *       amount_refunded: 0,
 *       refund_status: null,
 *       captured: true,
 *       description: null,
 *       card_id: null,
 *       bank: null,
 *       wallet: null,
 *       vpa: null,
 *       email: "customer@example.com",
 *       contact: "+919999999999",
 *       notes: { orderId: "... ", ... },
 *       fee: 1133,
 *       tax: 0,
 *       error_code: null,
 *       error_description: null,
 *       error_source: null,
 *       error_reason: null,
 *       error_step: null,
 *       error_field: null,
 *       acquirer_data: { auth_code: null },
 *       created_at: 1628087605
 *     }
 *   }
 * }
 * 
 * Key Features:
 * - Verifies webhook signature to ensure it's from Razorpay
 * - Updates payment log with payment details
 * - Handles multiple event types
 * - Does NOT modify the original order
 * 
 * Event Types Handled:
 * - payment.authorized: Payment successful
 * - payment.failed: Payment failed
 * - order.paid: Order fully paid (alternative confirmation)
 */

import { NextRequest, NextResponse } from "next/server";
import { getRazorpayService } from "@/lib/razorpay";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      console.warn("Webhook received without signature header");
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const razorpayService = getRazorpayService();
    const isValid = razorpayService.verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.warn("Invalid webhook signature received");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    // Parse body after signature verification
    const body = JSON.parse(rawBody);
    const { event, payload, created_at } = body;

    console.log(`Processing Razorpay webhook: ${event}`, payload);

    // Handle different event types
    switch (event) {
      case "payment.authorized":
      case "payment.captured": {
        const payment = payload.payment;
        const orderNotes = payment.notes || {};

        // Extract order ID from notes
        const orderId = orderNotes.orderId;
        if (!orderId) {
          console.warn("Payment received without orderId in notes", payment.id);
          break;
        }

        // Find and update payment log
        const existingPaymentLog = await prisma.paymentLog.findFirst({
          where: {
            razorpayOrderId: payment.order_id,
          },
        });

        if (existingPaymentLog) {
          await prisma.paymentLog.update({
            where: { id: existingPaymentLog.id },
            data: {
              razorpayPaymentId: payment.id,
              status: "SUCCESS",
              metadata: {
                ...(typeof existingPaymentLog.metadata === 'object' && existingPaymentLog.metadata ? existingPaymentLog.metadata : {}),
                webhookEvent: event,
                paymentDetails: {
                  amount: payment.amount,
                  currency: payment.currency,
                  email: payment.email,
                  contact: payment.contact,
                  fee: payment.fee,
                },
              },
            },
          });
          console.log(`Updated payment log for order ${orderId}`);
        }
        break;
      }

      case "payment.failed": {
        const payment = payload.payment;
        const orderNotes = payment.notes || {};
        const orderId = orderNotes.orderId;

        if (!orderId) {
          console.warn("Failed payment received without orderId in notes", payment.id);
          break;
        }

        // Update payment log with failed status
        const existingPaymentLog = await prisma.paymentLog.findFirst({
          where: {
            razorpayOrderId: payment.order_id,
          },
        });

        if (existingPaymentLog) {
          await prisma.paymentLog.update({
            where: { id: existingPaymentLog.id },
            data: {
              razorpayPaymentId: payment.id,
              status: "FAILED",
              metadata: {
                ...(typeof existingPaymentLog.metadata === 'object' && existingPaymentLog.metadata ? existingPaymentLog.metadata : {}),
                webhookEvent: event,
                failureReason: {
                  code: payment.error_code,
                  description: payment.error_description,
                },
              },
            },
          });
          console.log(`Updated failed payment for order ${orderId}`);
        }
        break;
      }

      case "order.paid": {
        const order = payload.order;
        const notes = order.notes || {};
        const orderId = notes.orderId;

        if (!orderId) {
          console.warn("Order paid event without orderId in notes", order.id);
          break;
        }

        // This is an additional confirmation of payment
        // Update payment log if it exists
        const existingPaymentLog = await prisma.paymentLog.findFirst({
          where: {
            razorpayOrderId: order.id,
          },
        });

        if (existingPaymentLog) {
          await prisma.paymentLog.update({
            where: { id: existingPaymentLog.id },
            data: {
              status: "SUCCESS",
              metadata: {
                ...(typeof existingPaymentLog.metadata === 'object' && existingPaymentLog.metadata ? existingPaymentLog.metadata : {}),
                webhookEvent: event,
              },
            },
          });
          console.log(`Confirmed payment for order ${orderId} via order.paid event`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    // Always respond with 200 OK to acknowledge receipt
    return NextResponse.json({
      status: "received",
      event,
      timestamp: created_at,
    });
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Still return 200 to acknowledge receipt
    return NextResponse.json(
      {
        status: "received",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 200 }
    );
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
