import { NextRequest } from "next/server";
import { withAdmin } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/responses";
import prisma from "@/lib/prisma";
import { isValidSlug, slugify } from "@/lib/blog/slug";

export const runtime = "nodejs";

/**
 * GET /api/admin/blogs/slug-check?slug=...&excludeId=...
 *
 * Powers the live availability indicator under the slug field. It reports
 * whether a slug is free; it does not reserve it. The authoritative uniqueness
 * check runs on save, where the unique index settles any race.
 */
async function handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = (searchParams.get("slug") || "").trim().toLowerCase();
    const excludeId = (searchParams.get("excludeId") || "").trim();

    if (!raw) {
      return successResponse({ slug: "", available: false, reason: "Slug is empty" });
    }

    const normalized = slugify(raw);

    if (!isValidSlug(raw)) {
      return successResponse({
        slug: normalized,
        available: false,
        reason: `Not a valid slug. Suggested: ${normalized}`,
      });
    }

    const existing = await prisma.post.findUnique({
      where: { slug: raw },
      select: { id: true },
    });

    // A retired slug still points at a live post through a 301, so reusing it
    // for a different post would break that redirect.
    const redirect = await prisma.postSlugRedirect.findUnique({
      where: { oldSlug: raw },
      select: { postId: true },
    });

    const takenByOther =
      (existing && existing.id !== excludeId) ||
      (redirect && redirect.postId !== excludeId);

    return successResponse({
      slug: raw,
      available: !takenByOther,
      reason: takenByOther ? "Already in use" : null,
    });
  } catch (error) {
    console.error("Admin blog slug-check error:", error);
    return errorResponse("Failed to check slug", 500);
  }
}

export const GET = withAdmin(handler);
