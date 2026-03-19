import { NextResponse } from "next/server";
import cloudinary from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function GET() {
  try {
    await cloudinary.api.ping();

    return NextResponse.json(
      {
        status: "ok",
        cloudinary: "connected",
        timestamp: new Date(),
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloudinary ping failed";
    return NextResponse.json(
      {
        status: "error",
        message,
      },
      { status: 500 }
    );
  }
}
