import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { checkRateLimit } from "@/lib/rate-limit";
import { Role } from "@prisma/client";

import { newsletterSchema } from "@/lib/validators";
import { errorResponse, successResponse } from "@/lib/responses";

// Helper to generate slug from subject
function generateSlug(subject: string): string {
  const baseSlug = subject
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${timestamp}`;
}

// GET /api/admin/newsletters - List all newsletters
export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, 60);
  if (!rl.ok) {
    const res = errorResponse("Too many requests", 429);
    if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
    return res;
  }
  try {
    const { user, error } = await authenticate(request);

    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    
    // Filters
    const status = searchParams.get("status"); // draft, sent, scheduled
    const search = searchParams.get("search");

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status === "draft") {
      where.isSent = false;
      where.scheduledAt = null;
    } else if (status === "sent") {
      where.isSent = true;
    } else if (status === "scheduled") {
      where.isSent = false;
      where.scheduledAt = { not: null };
    }

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
      ];
    }

    const [newsletters, total] = await Promise.all([
      prisma.newsletter.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.newsletter.count({ where }),
    ]);

    // Get subscriber count
    const subscriberCount = await prisma.newsletterSubscriber.count({
      where: { isActive: true },
    });

    return NextResponse.json({
      newsletters,
      subscriberCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get newsletters error:", error);
    return errorResponse("Failed to fetch newsletters", 500);
  }
}

// POST /api/admin/newsletters - Create new newsletter
export async function POST(request: NextRequest) {
  const rl = checkRateLimit(request, 20);
  if (!rl.ok) {
    const res = errorResponse("Too many requests", 429);
    if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
    return res;
  }
  try {
    const { user, error } = await authenticate(request);

    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const body = await request.json();
    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e => e.message).join(", "), 400);
    }
    const { subject, content, previewText } = parsed.data;
    const { scheduledAt } = body as any;

    const slug = generateSlug(subject);

    const newsletter = await prisma.newsletter.create({
      data: {
        subject: subject.trim(),
        slug,
        content: content.trim(),
        previewText: previewText?.trim() || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
    });

    return successResponse({ message: "Newsletter created successfully", newsletter });
  } catch (error) {
    console.error("Create newsletter error:", error);
    return errorResponse("Failed to create newsletter", 500);
  }
}
