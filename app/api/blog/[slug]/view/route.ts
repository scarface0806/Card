import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/responses";
import { checkRateLimit } from "@/lib/rate-limit";
import { hashIp, hashSession } from "@/lib/blog/tokens";
import { PostStatus } from "@prisma/client";

export const runtime = "nodejs";

const bodySchema = z.object({
  sessionId: z.string().trim().min(8).max(64),
  referrer: z.string().trim().max(500).optional().default(""),
});

/**
 * Crawlers, previewers and uptime checks announce themselves in the UA string.
 * They are not readers, so they must not move the numbers the admin makes
 * editorial decisions from.
 */
const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|monitor|headless|lighthouse|pingdom|curl|wget|python-requests|axios|node-fetch|postman|semrush|ahrefs|mj12|dotbot|petalbot|gptbot|claudebot|ccbot/i;

/** Two hits from one session inside this window are one page view. */
const DEDUPE_WINDOW_MS = 30_000;

function isBot(userAgent: string): boolean {
  return userAgent.trim() === "" || BOT_PATTERN.test(userAgent);
}

function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  return (forwarded.split(",")[0] || request.headers.get("x-real-ip") || "unknown").trim();
}

/**
 * POST /api/blog/[slug]/view
 *
 * Fired once per session from the post page. The page never waits on it and
 * never surfaces its failure, so everything here is best-effort by design.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params;

    // 30 hits/minute/IP on one post is already far past human reading speed.
    const { ok, retryAfter } = checkRateLimit(request, 30);
    if (!ok) {
      const response = errorResponse("Too many requests", 429);
      if (retryAfter) response.headers.set("Retry-After", String(retryAfter));
      return response;
    }

    const userAgent = request.headers.get("user-agent") || "";
    if (isBot(userAgent)) {
      // 200, not 403: a bot learns nothing from being told it was filtered.
      return successResponse({ counted: false });
    }

    const parsed = bodySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return errorResponse("Invalid request", 400);

    // Only a live post accrues views. A draft or a scheduled post is invisible
    // to the public page anyway; this stops a guessed slug from creating rows.
    const post = await prisma.post.findFirst({
      where: { slug, status: PostStatus.PUBLISHED, publishedAt: { not: null, lte: new Date() } },
      select: { id: true },
    });

    if (!post) return successResponse({ counted: false });

    const sessionHash = hashSession(parsed.data.sessionId);

    // The most recent view this session recorded for this post, if any. One
    // indexed read answers both questions below.
    const previous = await prisma.postView.findFirst({
      where: { postId: post.id, sessionHash },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });

    // A second hit within the debounce window is the same page view arriving
    // twice — React strict mode mounting the effect twice in development, a
    // retry, a fast refresh. The client's sessionStorage guard normally stops
    // it; this makes the guarantee server-side so a cleared guard or a second
    // tab cannot inflate the count either.
    if (previous && Date.now() - previous.createdAt.getTime() < DEDUPE_WINDOW_MS) {
      return successResponse({ counted: false });
    }

    await prisma.postView.create({
      data: {
        postId: post.id,
        sessionHash,
        ipHash: hashIp(clientIp(request)),
        userAgent: userAgent.slice(0, 300),
        referrer: parsed.data.referrer.slice(0, 500) || null,
        country: request.headers.get("x-vercel-ip-country"),
      },
    });

    await prisma.post.update({
      where: { id: post.id },
      data: {
        views: { increment: 1 },
        // Only the first time this session ever reads this post.
        ...(previous ? {} : { uniqueViews: { increment: 1 } }),
      },
    });

    return successResponse({ counted: true });
  } catch (error) {
    console.error("Blog view tracking error:", error);
    // Never let analytics break a page render.
    return successResponse({ counted: false });
  }
}
