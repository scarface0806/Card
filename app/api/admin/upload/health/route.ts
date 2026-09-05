import { NextRequest } from "next/server";
import cloudinary from "@/lib/cloudinary";
import { withAdmin } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/responses";

export const runtime = "nodejs";

/**
 * Cloudinary connectivity check, for the admin upload UI.
 *
 * ADMIN ONLY. This was previously unauthenticated, which gave anyone on the
 * internet two things they should not have:
 *
 *  1. An endpoint that makes an outbound authenticated API call to Cloudinary
 *     on demand - free amplification, and a way to burn the account's rate
 *     budget from outside.
 *  2. Cloudinary's raw error text on failure, which names the account state
 *     and configuration. Provider errors are internal diagnostics, not public
 *     ones.
 *
 * The failure branch now logs the real message server-side and returns a
 * generic one, so the diagnosis is still available to whoever is on call
 * without being published to the caller.
 */
export const GET = withAdmin(async (_request: NextRequest, _user) => {
  try {
    await cloudinary.api.ping();
    return successResponse({
      status: "ok",
      cloudinary: "connected",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error(
      "[upload-health] Cloudinary ping failed:",
      error instanceof Error ? error.message : error
    );
    return errorResponse("Image service unavailable", 503);
  }
});
