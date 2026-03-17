import { NextResponse } from "next/server";
import { pingMongo } from "@/lib/mongodb";

export async function GET() {
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

  return NextResponse.json({
    env: process.env.NODE_ENV,
    database,
    hasDatabaseUrl,
    hasJwtSecret,
  });
}
