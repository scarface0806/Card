/**
 * POST /api/admin/orders/:id/emails - resend one transactional order email.
 *
 * Admin only, via the existing withAdmin guard. There is deliberately no
 * unauthenticated variant of this route: it can put mail in a customer's inbox.
 *
 * Resend semantics live in src/lib/emails/send-order-email.ts. The short
 * version: this UPDATES the existing email_log row for (order, type) back to
 * pending and sends again. The unique index on (orderId, type) is never
 * dropped, so a permanently failed send is retried in place rather than by
 * accumulating rows.
 *
 * The response always includes the current per-type state so the admin drawer
 * can re-render without a second request.
 */

import { NextRequest, NextResponse } from "next/server";

import { withAdmin } from "@/lib/auth-middleware";
import { resendOrderEmail } from "@/lib/emails/send-order-email";
import { EMAIL_TYPE_ORDER } from "@/lib/emails/types";
import prisma from "@/lib/prisma";
import { errorResponse } from "@/lib/responses";
import { resendOrderEmailSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

async function readEmailStates(orderId: string) {
  const logs = await prisma.emailLog.findMany({
    where: { orderId },
    select: {
      type: true,
      status: true,
      error: true,
      sentAt: true,
      providerId: true,
    },
  });

  // Return one entry per known type, so "never attempted" is explicit rather
  // than a gap the client has to infer.
  return EMAIL_TYPE_ORDER.map((type) => {
    const log = logs.find((entry) => entry.type === type);
    return (
      log ?? {
        type,
        status: "not_sent",
        error: null,
        sentAt: null,
        providerId: null,
      }
    );
  });
}

export const GET = withAdmin(
  async (_request: NextRequest, _user, context?: RouteContext) => {
    const params = await context?.params;
    const orderId = params?.id;

    if (!orderId) {
      return errorResponse("Order id is required", 400);
    }

    return NextResponse.json({
      success: true,
      emails: await readEmailStates(orderId),
    });
  }
);

export const POST = withAdmin(
  async (request: NextRequest, _user, context?: RouteContext) => {
    const params = await context?.params;
    const orderId = params?.id;

    if (!orderId) {
      return errorResponse("Order id is required", 400);
    }

    const body = await request.json().catch(() => null);
    const parsed = resendOrderEmailSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues.map((issue) => issue.message).join(", "),
        400
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    const result = await resendOrderEmail(orderId, parsed.data.type);

    // A refused resend is not a server error - the admin needs to see WHY
    // (no recipient address, missing courier, provider rejection), which is
    // also now recorded on the email_log row.
    return NextResponse.json({
      success: result.ok,
      message: result.ok
        ? "Email sent"
        : result.reason,
      emails: await readEmailStates(orderId),
    });
  }
);
