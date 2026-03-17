import { NextResponse } from "next/server";
import { pingMongo } from "@/lib/mongodb";

type HealthValue = "exists" | "missing";
type DatabaseState = "connected" | "failed";

export async function GET() {
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

  return NextResponse.json(payload, {
    status: database === "connected" ? 200 : 503,
  });
}
