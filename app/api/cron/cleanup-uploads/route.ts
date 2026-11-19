import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { cleanupAbandonedUploads } from "@/lib/upload-cleanup";

/**
 * GET /api/cron/cleanup-uploads
 *
 * Daily Vercel Cron job (schedule in vercel.json) that deletes abandoned
 * checkout uploads - see src/lib/upload-cleanup.ts for exactly what counts as
 * abandoned and why nothing else can be touched.
 *
 * AUTH: Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when the
 * CRON_SECRET environment variable is set on the project. This route REFUSES
 * to run without it: an unauthenticated endpoint that deletes files is not
 * acceptable even if the deletion rules are conservative.
 *
 * `?dryRun=1` reports what would be deleted without deleting it - use it once
 * by hand after deploying (with the same Authorization header).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: NextRequest, secret: string): boolean {
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  // Constant-time, so the secret cannot be guessed byte by byte from timing.
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    console.error("[cleanup-uploads] CRON_SECRET is not set; refusing to run.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = request.nextUrl.searchParams.get("dryRun") === "1";

  try {
    const report = await cleanupAbandonedUploads({ dryRun });
    console.info(
      `[cleanup-uploads] ${dryRun ? "dry run: would delete" : "deleted"} ${report.deleted.length}, failed ${report.failed.length}, scanned ${report.scanned}, referenced ${report.referenced}`
    );
    return NextResponse.json(report, { status: report.failed.length > 0 ? 207 : 200 });
  } catch (error) {
    // Nothing was deleted: listing and the order read happen before any delete.
    console.error("[cleanup-uploads] aborted:", error instanceof Error ? error.message : error);
    return NextResponse.json({ error: "Cleanup failed; nothing was deleted." }, { status: 500 });
  }
}
