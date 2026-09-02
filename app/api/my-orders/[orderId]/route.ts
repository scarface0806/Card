import { NextRequest } from "next/server";

import { authenticate } from "@/lib/auth-middleware";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import { getMyOrder } from "@/lib/my-orders";

/** Next.js 15+ hands params as a promise; it must be awaited. */
type RouteParams = { params: Promise<{ orderId: string }> };

/**
 * GET /api/my-orders/:orderId - one of the caller's own orders.
 *
 * An order that does not exist and an order belonging to somebody else both
 * return the SAME 404. A 403 for the second case would confirm that the id is
 * real and simply not theirs, which turns the route into a way to enumerate
 * valid order ids.
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const rateCheck = checkRateLimit(request, 60);
    if (!rateCheck.ok) {
      const res = errorResponse("Too many requests", 429);
      if (rateCheck.retryAfter) {
        res.headers.set("Retry-After", String(rateCheck.retryAfter));
      }
      return res;
    }

    const { user, error } = await authenticate(request);
    if (!user) {
      return errorResponse(error || "Unauthorized", 401);
    }

    const { orderId } = await params;

    // Scoped to this user inside getMyOrder - see the note there.
    const order = await getMyOrder(user.id, orderId);

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    return successResponse({ order }, 200);
  } catch (error) {
    console.error(
      "[MyOrders] Detail failed:",
      error instanceof Error ? error.message : String(error)
    );
    return errorResponse("We could not load this order. Please try again.", 500);
  }
}
