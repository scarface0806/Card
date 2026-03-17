import { pingMongo } from "@/lib/mongodb";
import { errorResponse, successResponse } from "@/lib/responses";

export async function GET() {
  try {
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
    const hasJwtSecret = Boolean(process.env.JWT_SECRET?.trim());

    let database: "connected" | "failed" = "failed";

    if (hasDatabaseUrl) {
      try {
        await pingMongo();
        database = "connected";
      } catch (error) {
        console.error("[Debug] Database check failed:", error);
        database = "failed";
      }
    }

    const payload = {
      env: process.env.NODE_ENV,
      database,
      hasDatabaseUrl,
      hasJwtSecret,
    };

    if (database === "connected") {
      return successResponse(payload, 200);
    }

    return errorResponse("Debug check failed", 503, payload);
  } catch (error) {
    console.error("[Debug] Unexpected error:", error);
    return errorResponse("Debug check failed", 500);
  }
}
