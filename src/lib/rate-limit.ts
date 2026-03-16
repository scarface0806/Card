import { NextRequest, NextResponse } from "next/server";
import LRU from "lru-cache";
import { errorResponse } from "@/lib/responses";

// simple in-memory rate limiter keyed by IP
const ipCache = new LRU<string, { count: number; reset: number }>({
  max: 5000,
  ttl: 1000 * 60 * 5, // keep entries a bit longer than a single window
});

export function checkRateLimit(
  request: NextRequest,
  limit = 60
): { ok: boolean; retryAfter?: number } {
  const windowMs = 60 * 1000;
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  const ip = (forwarded.split(",")[0] || realIp || "unknown").trim();

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
