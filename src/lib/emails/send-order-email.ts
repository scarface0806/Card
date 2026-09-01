/**
 * Transactional order email orchestration.
 *
 * SERVER-ONLY. Import this from route handlers, server actions and the payment
 * adapter - never from a client component.
 *
 * THE TWO RULES THIS FILE EXISTS TO ENFORCE
 *
 * 1. A failing email must never fail an order. Every public function here
 *    returns a result object and never throws. A provider outage, a bad API
 *    key, a missing courier field or a dead database all end the same way: a
 *    row in email_log and a server-side log line. Callers fire these AFTER the
 *    order write has committed, so nothing they do can roll an order back.
 *
 * 2. Idempotency lives in the database, not in this code. Each send claims its
 *    (orderId, type) row by INSERTING it with status "pending". The unique
 *    index makes a second insert fail with P2002, so a webhook retry or a
 *    double-clicked admin button finds the claim already taken and returns
 *    without sending. A read-then-write check would race both of those.
 */

import { Prisma } from "@prisma/client";
import { render } from "@react-email/render";

import prisma from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-config";
import { formatPrice } from "@/utils/formatPrice";

import {
  getEmailBcc,
  getEmailFrom,
  getEmailReplyTo,
  getResendClient,
} from "./resend";
import {
  OrderConfirmationEmail,
  orderConfirmationSubject,
} from "./templates/OrderConfirmationEmail";
import {
  OrderDeliveredEmail,
  orderDeliveredSubject,
} from "./templates/OrderDeliveredEmail";
import {
  OrderShippedEmail,
  orderShippedSubject,
} from "./templates/OrderShippedEmail";
import {
  EMAIL_LOG_STATUSES,
  EMAIL_TYPES,
  type EmailType,
  type OrderConfirmationEmailData,
  type OrderDeliveredEmailData,
  type OrderShippedEmailData,
} from "./types";

/**
 * Cap on how long the provider may hold the request open. The send already
 * happens after the order is committed, so this only protects response time.
 * A timeout is recorded as `failed` with wording that says delivery is
 * UNCONFIRMED rather than "not sent", because the request may still land.
 */
const SEND_TIMEOUT_MS = 12_000;

/** email_log.error is for humans reading the admin panel; keep it bounded. */
const MAX_ERROR_LENGTH = 800;

export type SendResult =
  | { ok: true; providerId: string | null }
  /** Another process owns this (orderId, type) - nothing was sent. */
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped: false; reason: string };

/** Fields the email layer is allowed to read. Nothing else is selected. */
const ORDER_EMAIL_SELECT = {
  id: true,
  orderNumber: true,
  recipientEmail: true,
  guestName: true,
  guestPhone: true,
  designation: true,
  company: true,
  // Product snapshot as sold. cardType is the name.
  cardType: true,
  productTier: true,
  productImageUrl: true,
  items: true,
  total: true,
  // Resolved to the public profile URL when the card already exists.
  cardId: true,
  courierName: true,
  trackingNumber: true,
  trackingUrl: true,
  expectedDeliveryFrom: true,
  expectedDeliveryTo: true,
} satisfies Prisma.OrderSelect;

type OrderForEmail = Prisma.OrderGetPayload<{ select: typeof ORDER_EMAIL_SELECT }>;

// ---------------------------------------------------------------------------
// Public triggers
// ---------------------------------------------------------------------------

/**
 * Order confirmation. Call from the server-side payment-success path only,
 * after the order row has been marked paid.
 */
export function sendOrderConfirmationEmail(orderId: string): Promise<SendResult> {
  return dispatch(orderId, EMAIL_TYPES.CONFIRMATION, { allowResend: false });
}

/** Shipped notice. Call after the status write to SHIPPED has committed. */
export function sendOrderShippedEmail(orderId: string): Promise<SendResult> {
  return dispatch(orderId, EMAIL_TYPES.SHIPPED, { allowResend: false });
}

/** Delivered notice. Call after the status write to DELIVERED has committed. */
export function sendOrderDeliveredEmail(orderId: string): Promise<SendResult> {
  return dispatch(orderId, EMAIL_TYPES.DELIVERED, { allowResend: false });
}

/**
 * Admin resend. Same pipeline, except it is allowed to take over an existing
 * `sent` or `failed` row by resetting it to `pending`. It still cannot take
 * over a row that is `pending`, because that means a send is in flight.
 *
 * This is why the unique index never has to be dropped to retry a permanently
 * failed send: the row is updated, not duplicated.
 */
export function resendOrderEmail(
  orderId: string,
  type: EmailType
): Promise<SendResult> {
  return dispatch(orderId, type, { allowResend: true });
}

/**
 * Map an order status to the email it should trigger, or null when that status
 * has no customer email. Keeps the status-to-email decision in one place
 * rather than duplicated across the two admin update routes.
 */
export function emailTypeForOrderStatus(status: string): EmailType | null {
  const normalized = status.toUpperCase();
  if (normalized === "SHIPPED") return EMAIL_TYPES.SHIPPED;
  if (normalized === "DELIVERED") return EMAIL_TYPES.DELIVERED;
  return null;
}

/**
 * Fire the email a status change owes the customer, if any. Never throws, so a
 * caller can await it directly after its own DB write without a try/catch.
 */
export async function sendOrderStatusEmail(
  orderId: string,
  status: string
): Promise<SendResult | null> {
  const type = emailTypeForOrderStatus(status);
  if (!type) return null;
  return dispatch(orderId, type, { allowResend: false });
}

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

async function dispatch(
  orderId: string,
  type: EmailType,
  { allowResend }: { allowResend: boolean }
): Promise<SendResult> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: ORDER_EMAIL_SELECT,
    });

    if (!order) {
      // No order row means no valid foreign key, so there is nowhere to log
      // this. Server log only.
      console.error("[order-email] " + type + ": order " + orderId + " not found");
      return { ok: false, skipped: true, reason: "Order not found" };
    }

    const claim = await claimSendSlot(orderId, type, allowResend);
    if (claim !== "claimed") {
      console.info(
        "[order-email] " + type + " for order " + orderId + ": slot already claimed, not sending"
      );
      return {
        ok: false,
        skipped: true,
        reason: "Another send for this order and type is already in progress",
      };
    }

    const built = await buildEmail(order, type);
    if (!built.ok) {
      await settleFailed(orderId, type, built.reason);
      return { ok: false, skipped: false, reason: built.reason };
    }

    const recipient = validateRecipient(order.recipientEmail);
    if (!recipient.ok) {
      await settleFailed(orderId, type, recipient.reason);
      return { ok: false, skipped: false, reason: recipient.reason };
    }

    const [html, text] = await Promise.all([
      render(built.element),
      // Same component, so the plain-text body cannot drift from the HTML.
      render(built.element, { plainText: true }),
    ]);

    if (!text.trim()) {
      const reason = "Rendered plain-text body was empty";
      await settleFailed(orderId, type, reason);
      return { ok: false, skipped: false, reason };
    }

    const providerId = await sendViaResend({
      to: recipient.email,
      subject: built.subject,
      html,
      text,
      // Automatic sends get a stable key so a provider-side retry of the same
      // send cannot duplicate the email. A resend is a deliberate new send and
      // therefore must not reuse the key.
      idempotencyKey: allowResend
        ? undefined
        : "order-email:" + orderId + ":" + type,
    });

    await prisma.emailLog.updateMany({
      where: { orderId, type },
      data: {
        status: EMAIL_LOG_STATUSES.SENT,
        providerId,
        error: null,
        sentAt: new Date(),
      },
    });

    return { ok: true, providerId };
  } catch (error) {
    const reason = describeError(error);
    console.error(
      "[order-email] " + type + " for order " + orderId + " failed: " + reason
    );
    await settleFailed(orderId, type, reason);
    return { ok: false, skipped: false, reason };
  }
}

/**
 * Claim (orderId, type) by inserting the pending row. The unique index is the
 * lock; P2002 means somebody else got there first.
 */
async function claimSendSlot(
  orderId: string,
  type: EmailType,
  allowResend: boolean
): Promise<"claimed" | "taken"> {
  try {
    await prisma.emailLog.create({
      data: {
        orderId,
        type,
        status: EMAIL_LOG_STATUSES.PENDING,
      },
    });
    return "claimed";
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;

    if (!allowResend) return "taken";

    // Resend: take the row back only if it is settled. A `pending` row means a
    // send is in flight and must not be stolen.
    const reclaimed = await prisma.emailLog.updateMany({
      where: {
        orderId,
        type,
        status: {
          in: [EMAIL_LOG_STATUSES.SENT, EMAIL_LOG_STATUSES.FAILED],
        },
      },
      data: {
        status: EMAIL_LOG_STATUSES.PENDING,
        providerId: null,
        error: null,
        sentAt: null,
      },
    });

    return reclaimed.count > 0 ? "claimed" : "taken";
  }
}

/** Record a failure. Best effort - a DB problem here must not throw either. */
async function settleFailed(orderId: string, type: EmailType, reason: string) {
  try {
    await prisma.emailLog.updateMany({
      where: { orderId, type },
      data: {
        status: EMAIL_LOG_STATUSES.FAILED,
        error: reason.slice(0, MAX_ERROR_LENGTH),
        sentAt: null,
      },
    });
  } catch (error) {
    console.error(
      "[order-email] could not record " +
        type +
        " failure for order " +
        orderId +
        ": " +
        describeError(error)
    );
  }
}

async function sendViaResend({
  to,
  subject,
  html,
  text,
  idempotencyKey,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}): Promise<string | null> {
  const bcc = getEmailBcc();

  const { data, error } = await withTimeout(
    getResendClient().emails.send(
      {
        from: getEmailFrom(),
        to,
        // One send with a blind copy, not two sends: the business gets the
        // customer's exact email, and there is still a single email_log row so
        // the idempotency guarantee is unchanged.
        ...(bcc ? { bcc } : {}),
        replyTo: getEmailReplyTo(),
        subject,
        html,
        text,
      },
      idempotencyKey ? { idempotencyKey } : undefined
    ),
    SEND_TIMEOUT_MS
  );

  // The SDK reports API failures in the payload rather than by throwing.
  if (error) {
    throw new Error("Resend rejected the send: " + (error.message || error.name));
  }

  return data?.id ?? null;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            "Resend did not respond within " +
              ms +
              "ms - delivery is UNCONFIRMED, check the Resend dashboard before resending"
          )
        ),
      ms
    );
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  }) as Promise<T>;
}

// ---------------------------------------------------------------------------
// Content assembly
// ---------------------------------------------------------------------------

type BuildResult =
  | { ok: true; subject: string; element: React.ReactElement }
  | { ok: false; reason: string };

/**
 * Public URL of the customer's digital profile, or null.
 *
 * The Card row is created when an admin moves the order to CONFIRMED, which is
 * AFTER payment - so this is null in the confirmation email for a fresh order,
 * and the template says the link will follow rather than printing a dead one.
 * A resend after confirmation picks the link up.
 */
async function resolveProfileUrl(cardId: string | null): Promise<string | null> {
  if (!cardId) return null;

  try {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: { slug: true },
    });
    return card?.slug ? SITE_URL + "/card/" + card.slug : null;
  } catch (error) {
    // A missing profile link must not stop the confirmation going out.
    console.warn(
      "[order-email] could not resolve the profile URL for card " +
        cardId +
        ": " +
        describeError(error)
    );
    return null;
  }
}

async function buildEmail(
  order: OrderForEmail,
  type: EmailType
): Promise<BuildResult> {
  const orderRef = order.orderNumber;
  const trackUrl = SITE_URL + "/track-order?ref=" + encodeURIComponent(orderRef);
  const profileUrl = await resolveProfileUrl(order.cardId);

  if (type === EMAIL_TYPES.CONFIRMATION) {
    const data: OrderConfirmationEmailData = {
      orderRef,
      trackUrl,
      // Every field below comes from the order row, which was itself built
      // from productId server-side. Nothing is read from a request body or a
      // query string, so the email cannot disagree with what was charged.
      productName:
        order.cardType || order.items[0]?.productName || "NFC Digital Card",
      productTier: order.productTier,
      productImageUrl: toAbsoluteHttpsUrl(order.productImageUrl),
      quantity: order.items[0]?.quantity ?? 1,
      // formatPrice is the same helper the catalogue and checkout use, so the
      // figure here is identical to the one on the payment step.
      amountPaid: formatPrice(order.total ?? 0),
      proof: {
        name: order.guestName || "Not given",
        designation: order.designation,
        company: order.company,
        mobile: order.guestPhone,
        email: order.recipientEmail,
      },
      profileUrl,
    };
    return {
      ok: true,
      subject: orderConfirmationSubject(data),
      element: OrderConfirmationEmail(data),
    };
  }

  if (type === EMAIL_TYPES.SHIPPED) {
    // A half-empty tracking notice is worse than no email, so a missing
    // courier or tracking number is a failure, not a blank line.
    const courierName = order.courierName?.trim();
    const trackingNumber = order.trackingNumber?.trim();

    const missing: string[] = [];
    if (!courierName) missing.push("courier name");
    if (!trackingNumber) missing.push("tracking number");
    if (!courierName || !trackingNumber) {
      return {
        ok: false,
        reason:
          "Not sent: the order is missing " +
          missing.join(" and ") +
          ". Fill these in on the order and resend.",
      };
    }

    const data: OrderShippedEmailData = {
      orderRef,
      trackUrl,
      courierName,
      trackingNumber,
      trackingUrl: order.trackingUrl?.trim() || null,
      expectedDelivery: formatDeliveryWindow(
        order.expectedDeliveryFrom,
        order.expectedDeliveryTo
      ),
    };
    return {
      ok: true,
      subject: orderShippedSubject(data),
      element: OrderShippedEmail(data),
    };
  }

  const data: OrderDeliveredEmailData = { orderRef, trackUrl };
  return {
    ok: true,
    subject: orderDeliveredSubject(data),
    element: OrderDeliveredEmail(data),
  };
}

/**
 * The recipient is the address typed into the checkout form and nothing else.
 * There is deliberately no fallback to the logged-in account email: the person
 * paying is often not the person whose card is being printed.
 */
function validateRecipient(
  recipientEmail: string | null
): { ok: true; email: string } | { ok: false; reason: string } {
  const email = recipientEmail?.trim();

  if (!email) {
    return {
      ok: false,
      reason:
        "Not sent: this order has no recipientEmail (the address typed at checkout). We never fall back to the account email, so nothing was sent.",
    };
  }

  // Cheap sanity check only - the provider is the real authority.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      reason: 'Not sent: recipientEmail "' + email + '" is not a valid address.',
    };
  }

  return { ok: true, email };
}

/**
 * Absolute https URL, or null.
 *
 * Mail clients will not load a relative path and will not load http, so an
 * image that cannot be expressed as an absolute https URL is dropped rather
 * than embedded as a broken one. On a local dev origin
 * (NEXT_PUBLIC_SITE_URL=http://localhost:3000) that means product artwork
 * stored as a relative upload path is omitted from the email - Cloudinary URLs,
 * which is what the admin uploader produces, are already absolute https.
 */
function toAbsoluteHttpsUrl(url: string | null): string | null {
  const raw = url?.trim();
  if (!raw) return null;

  try {
    const resolved = new URL(raw, SITE_URL);
    return resolved.protocol === "https:" ? resolved.toString() : null;
  } catch {
    return null;
  }
}

function formatDeliveryWindow(
  from: Date | null,
  to: Date | null
): string | null {
  const day = (date: Date) =>
    date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });

  if (from && to) return day(from) + " to " + day(to);
  if (to) return "By " + day(to);
  if (from) return "From " + day(from);
  return null;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

function describeError(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2031") {
      return "Prisma could not write email_log: this MongoDB deployment is not a replica set (P2031). Point DATABASE_URL at a replica set or Atlas.";
    }
    return error.code + ": " + error.message;
  }
  if (error instanceof Error) return error.message;
  return "Unknown error";
}
