/**
 * POST /api/payment/webhook
 *
 * Razorpay webhook handler. Razorpay calls it server-to-server, so it is the
 * one path that still fulfils an order when the customer closes the tab
 * between paying and the browser's verify call.
 *
 * Webhook configuration (Razorpay dashboard):
 * - URL: https://tapvyo.in/api/payment/webhook
 * - Events: payment.captured, order.paid, qr_code.credited, payment.failed
 *   (payment.authorized is accepted but only recorded)
 * - Secret: RAZORPAY_WEBHOOK_SECRET
 *
 * Body shape (Razorpay docs, webhooks/payloads): every entity is nested under
 * `entity` - payload.payment.entity, payload.order.entity,
 * payload.qr_code.entity. The previous handler read payload.payment directly
 * and looked for notes.orderId (checkout sends notes.existingOrderId), so it
 * never matched an order and never fulfilled anything.
 *
 * How it works:
 * - Verifies X-Razorpay-Signature over the RAW body before parsing (400 if
 *   missing, 403 if wrong - unchanged).
 * - Finds our PaymentLog by Razorpay's own ids (order_id / order.id /
 *   qr_code.id), never by notes, and checks amount + currency against it.
 * - Claims the log with the same compare-and-set verifyPayment uses, then
 *   calls fulfilPayment (src/lib/payment-adapter.ts). Whichever of webhook /
 *   verify / UPI poll arrives first, the order is marked paid and the emails
 *   go out exactly once.
 * - 200 for anything handled or deliberately ignored (unknown event, unknown
 *   payment log, amount mismatch). 500 on an internal error, so Razorpay
 *   retries; every step is idempotent, so a retry is safe.
 * - Logs one line per event: event name, order id and outcome. Never the
 *   payload, the customer's email or phone, or the payment id.
 */

import { NextRequest, NextResponse } from "next/server";
import type { PaymentLog } from "@prisma/client";
import { getRazorpayService } from "@/lib/razorpay";
import { getPaymentAdapterService } from "@/lib/payment-adapter";
import { toPaise } from "@/lib/payment-amount";
import prisma from "@/lib/prisma";

type RazorpayPaymentEntity = {
  id?: string;
  order_id?: string | null;
  amount?: number;
  currency?: string;
  status?: string;
  method?: string;
  fee?: number;
  error_code?: string | null;
  error_description?: string | null;
};

type RazorpayIdEntity = { id?: string };

/** payload.<key>.entity, or null when the event does not carry that entity. */
function entityOf<T>(payload: unknown, key: string): T | null {
  const wrapper = (payload as Record<string, unknown> | undefined)?.[key] as
    | { entity?: unknown }
    | undefined;
  const value = wrapper?.entity;
  return value && typeof value === "object" ? (value as T) : null;
}

/** Same comparison the UPI poll uses: integer paise and the same currency. */
function amountMatches(log: PaymentLog, payment: RazorpayPaymentEntity): boolean {
  try {
    return payment.amount === toPaise(log.amount) && payment.currency === log.currency;
  } catch {
    return false;
  }
}

/** Existing metadata plus this event. No email or phone - PaymentLog holds those already. */
function mergedMetadata(log: PaymentLog, event: string, payment: RazorpayPaymentEntity | null) {
  const existing = log.metadata && typeof log.metadata === "object" && !Array.isArray(log.metadata)
    ? (log.metadata as Record<string, unknown>)
    : {};
  return {
    ...existing,
    webhookEvent: event,
    ...(payment
      ? {
          paymentDetails: {
            amount: payment.amount ?? null,
            currency: payment.currency ?? null,
            method: payment.method ?? null,
            fee: payment.fee ?? null,
          },
        }
      : {}),
  };
}

/**
 * Claim the log for this payment and fulfil the order. Returns the outcome
 * for the log line.
 */
async function claimAndFulfil(
  log: PaymentLog,
  payment: RazorpayPaymentEntity | null,
  event: string,
  method: "razorpay" | "razorpay_upi"
): Promise<string> {
  if (!payment?.id) return "no payment entity, ignored";
  if (!amountMatches(log, payment)) return "amount or currency mismatch, ignored";

  const claimed = await prisma.paymentLog.updateMany({
    where: { id: log.id, status: { not: "SUCCESS" } },
    data: {
      status: "SUCCESS",
      razorpayPaymentId: payment.id,
      metadata: mergedMetadata(log, event, payment),
    },
  });

  // Lost the claim: verify / the UPI poll / an earlier delivery recorded it.
  // A DIFFERENT payment already recorded for this log means the customer paid
  // twice - fulfilling again would be wrong, a refund is.
  if (claimed.count === 0 && log.razorpayPaymentId && log.razorpayPaymentId !== payment.id) {
    return "a different payment is already recorded for this order, check for a refund";
  }

  const { fulfilled } = await getPaymentAdapterService().fulfilPayment({
    existingOrderId: log.existingOrderId,
    razorpayPaymentId: payment.id,
    method,
  });
  return fulfilled ? "fulfilled" : "already fulfilled";
}

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
    const { event, payload, created_at } = body as { event?: string; payload?: unknown; created_at?: number };
    const eventName = typeof event === "string" ? event : "unknown";

    let orderId = "unknown";
    let outcome = "unhandled event, ignored";

    switch (eventName) {
      case "payment.captured": {
        const payment = entityOf<RazorpayPaymentEntity>(payload, "payment");
        const log = payment?.order_id
          ? await prisma.paymentLog.findUnique({ where: { razorpayOrderId: payment.order_id } })
          : null;
        if (!log) {
          outcome = "unknown payment log, ignored";
          break;
        }
        orderId = log.existingOrderId;
        outcome = await claimAndFulfil(log, payment, eventName, "razorpay");
        break;
      }

      case "order.paid": {
        const order = entityOf<RazorpayIdEntity>(payload, "order");
        const payment = entityOf<RazorpayPaymentEntity>(payload, "payment");
        const log = order?.id
          ? await prisma.paymentLog.findUnique({ where: { razorpayOrderId: order.id } })
          : null;
        if (!log) {
          outcome = "unknown payment log, ignored";
          break;
        }
        orderId = log.existingOrderId;
        outcome = await claimAndFulfil(log, payment, eventName, "razorpay");
        break;
      }

      case "qr_code.credited": {
        // QR payments carry order_id: null; the QR code id is the link.
        const qrCode = entityOf<RazorpayIdEntity>(payload, "qr_code");
        const payment = entityOf<RazorpayPaymentEntity>(payload, "payment");
        const log = qrCode?.id
          ? await prisma.paymentLog.findFirst({ where: { razorpayQrCodeId: qrCode.id } })
          : null;
        if (!log) {
          outcome = "unknown payment log, ignored";
          break;
        }
        orderId = log.existingOrderId;
        outcome = await claimAndFulfil(log, payment, eventName, "razorpay_upi");
        break;
      }

      case "payment.authorized": {
        // Authorized is not captured: record it, fulfil nothing.
        const payment = entityOf<RazorpayPaymentEntity>(payload, "payment");
        const log = payment?.order_id
          ? await prisma.paymentLog.findUnique({ where: { razorpayOrderId: payment.order_id } })
          : null;
        if (!log) {
          outcome = "unknown payment log, ignored";
          break;
        }
        orderId = log.existingOrderId;
        await prisma.paymentLog.updateMany({
          where: { id: log.id },
          data: { metadata: mergedMetadata(log, eventName, payment) },
        });
        outcome = "recorded, not fulfilled";
        break;
      }

      case "payment.failed": {
        const payment = entityOf<RazorpayPaymentEntity>(payload, "payment");
        const log = payment?.order_id
          ? await prisma.paymentLog.findUnique({ where: { razorpayOrderId: payment.order_id } })
          : null;
        if (!log) {
          outcome = "unknown payment log, ignored";
          break;
        }
        orderId = log.existingOrderId;
        // Conditional: a failed attempt (Razorpay does not guarantee event
        // order) must never flip a successful payment to FAILED.
        const marked = await prisma.paymentLog.updateMany({
          where: { id: log.id, status: { not: "SUCCESS" } },
          data: {
            status: "FAILED",
            ...(payment?.id ? { razorpayPaymentId: payment.id } : {}),
            metadata: {
              ...mergedMetadata(log, eventName, payment),
              failureReason: {
                code: payment?.error_code ?? null,
                description: payment?.error_description ?? null,
              },
            },
          },
        });
        outcome = marked.count ? "marked failed" : "already succeeded, failure ignored";
        break;
      }
    }

    console.log(`[webhook] ${eventName} order ${orderId}: ${outcome}`);

    return NextResponse.json({
      status: "received",
      event,
      timestamp: created_at,
    });
  } catch (error) {
    // 500, not 200: Razorpay retries a failed delivery, and every step above
    // is idempotent. Acknowledging a failed write lost the event for good.
    console.error(
      "[webhook] processing failed:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
