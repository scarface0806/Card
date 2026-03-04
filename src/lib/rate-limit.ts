import { NextRequest, NextResponse } from "next/server";
import LRU from "lru-cache";
import { errorResponse } from "@/lib/responses";

// simple in-memory rate limiter keyed by IP
const ipCache = new LRU<string, { count: number; reset: number }>({
  max: 5000,
  ttl: 1000 * 60, // 1 minute window
});

export function checkRateLimit(
  request: NextRequest,
  limit = 60
): { ok: boolean; retryAfter?: number } {
  const ip =
    (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")) ??
    "unknown";

  const now = Date.now();
  const entry = ipCache.get(ip) || { count: 0, reset: now + 60 * 1000 };
  entry.count += 1;
  ipCache.set(ip, entry);

  if (entry.count > limit) {
    return { ok: false, retryAfter: Math.ceil((entry.reset - now) / 1000) };
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
