import { pingMongo } from "@/lib/mongodb";
import { errorResponse, successResponse } from "@/lib/responses";

type HealthValue = "exists" | "missing";
type DatabaseState = "connected" | "failed";

export async function GET() {
  try {
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());
    const hasJwtSecret = Boolean(process.env.JWT_SECRET?.trim());

    let database: DatabaseState = "failed";

    if (hasDatabaseUrl) {
      try {
        await pingMongo();
        database = "connected";
      } catch (error) {
        console.error("[Health] Database ping failed:", error);
        database = "failed";
      }
    }

    const payload: {
      database: DatabaseState;
      DATABASE_URL: HealthValue;
      JWT_SECRET: HealthValue;
    } = {
      database,
      DATABASE_URL: hasDatabaseUrl ? "exists" : "missing",
      JWT_SECRET: hasJwtSecret ? "exists" : "missing",
    };

    if (database === "connected") {
      return successResponse(payload, 200);
    }

    return errorResponse("Health check failed", 503, payload);
  } catch (error) {
    console.error("[Health] Unexpected error:", error);
    return errorResponse("Health check failed", 500);
  }
}
