import { NextRequest } from "next/server";

import { authenticate } from "@/lib/auth-middleware";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import { listMyOrders } from "@/lib/my-orders";

/**
 * GET /api/my-orders - the caller's own orders.
 *
 * Distinct from /api/orders on purpose. That route returns whole order rows
 * and grants admins a view of everyone's, which is right for the admin panel;
 * this one has no admin branch at all and returns only the projection in
 * src/lib/my-orders.ts. An endpoint the customer's browser calls should not be
 * able to widen its own scope.
 *
 * Ownership is enforced inside listMyOrders, which puts `userId` in the where
 * clause rather than filtering after the read.
 */
export async function GET(request: NextRequest) {
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

    const orders = await listMyOrders(user.id);

    return successResponse({ orders }, 200);
  } catch (error) {
    console.error(
      "[MyOrders] List failed:",
      error instanceof Error ? error.message : String(error)
    );
    return errorResponse("We could not load your orders. Please try again.", 500);
  }
}
