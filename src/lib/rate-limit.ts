import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/responses";

// simple in-memory rate limiter keyed by IP (no external deps)
const ipCache = new Map<string, { count: number; reset: number }>();
const MAX_ENTRIES = 5000;

function pruneCache() {
  if (ipCache.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, val] of ipCache) {
    if (now >= val.reset) ipCache.delete(key);
  }
  // If still over limit after pruning expired, drop oldest entries
  if (ipCache.size > MAX_ENTRIES) {
    const excess = ipCache.size - MAX_ENTRIES;
    let i = 0;
    for (const key of ipCache.keys()) {
      if (i++ >= excess) break;
      ipCache.delete(key);
    }
  }
}

export function checkRateLimit(
  request: NextRequest,
  limit = 60
): { ok: boolean; retryAfter?: number } {
  const windowMs = 60 * 1000;
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  const ip = (forwarded.split(",")[0] || realIp || "unknown").trim();

  pruneCache();
  const now = Date.now();
  const key = `${request.nextUrl.pathname}:${ip}`;
  const existing = ipCache.get(key);
  const entry = !existing || now >= existing.reset
    ? { count: 0, reset: now + windowMs }
    : existing;

  entry.count += 1;
  ipCache.set(key, entry);

  if (entry.count > limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((entry.reset - now) / 1000)) };
  }
  return { ok: true };
}

export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  limit = 60
) {
  return async (request: NextRequest, ...args: any[]) => {
    const { ok, retryAfter } = checkRateLimit(request, limit);
    if (!ok) {
      const res = errorResponse("Too many requests", 429);
      if (retryAfter) {
        res.headers.set("Retry-After", String(retryAfter));
      }
      return res;
    }
    return handler(request, ...args);
  };
}
