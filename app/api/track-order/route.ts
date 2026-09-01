/**
 * POST /api/track-order - public order tracking lookup. No login.
 *
 * SECURITY
 * - Rate limited on the client IP through Upstash Redis BEFORE the database is
 *   touched, so a guessing loop cannot be run cheaply. If Upstash is not
 *   configured the route refuses every request rather than running unlimited.
 * - One message for every failure. Wrong reference, correct reference with the
 *   wrong mobile, and a reference that never existed are indistinguishable
 *   from the outside, so this endpoint cannot be used to confirm that an order
 *   reference exists.
 * - The success payload is built from a narrow projection in
 *   src/lib/track-order.ts. No address, payment or email data is selected, let
 *   alone returned.
 */

import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/responses";
import {
  RateLimiterUnavailableError,
  getClientIp,
  limitTrackOrderLookup,
} from "@/lib/track-order-rate-limit";
import {
  TRACK_ORDER_FAILURE_MESSAGE,
  lookupOrderForTracking,
} from "@/lib/track-order";
import { trackOrderSchema } from "@/lib/validators";

/** The generic answer. Identical body for every kind of miss. */
function notFound(status = 404) {
  return NextResponse.json(
    { success: false, message: TRACK_ORDER_FAILURE_MESSAGE },
    { status }
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  try {
    const decision = await limitTrackOrderLookup(ip);

    if (!decision.ok) {
      // Same wording as a miss, so a throttled attacker learns nothing about
      // whether their last guess was close. Retry-After still tells an honest
      // customer when to come back.
      const response = notFound(429);
      if (decision.retryAfter) {
        response.headers.set("Retry-After", String(decision.retryAfter));
      }
      return response;
    }
  } catch (error) {
    if (error instanceof RateLimiterUnavailableError) {
      console.error(
        "[track-order] refusing lookup: rate limiter unavailable",
        error.message
      );
      return errorResponse(
        "Order tracking is temporarily unavailable. Please contact support.",
        503
      );
    }

    // An Upstash outage is also a refusal - never a free pass.
    console.error("[track-order] rate limit check failed:", error);
    return errorResponse(
      "Order tracking is temporarily unavailable. Please contact support.",
      503
    );
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = trackOrderSchema.safeParse(body);

    // Even a malformed body gets the generic message: "your reference is the
    // wrong shape" is one bit more than this endpoint should give away.
    if (!parsed.success) {
      return notFound(400);
    }

    const order = await lookupOrderForTracking(parsed.data.ref, parsed.data.mobile);

    if (!order) {
      return notFound();
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("Track order lookup error:", error);
    return errorResponse("Could not look up that order right now.", 500);
  }
}
