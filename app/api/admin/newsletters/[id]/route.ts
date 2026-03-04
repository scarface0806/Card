import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/responses";
import { Role } from "@prisma/client";

// Helper to extract ID from URL
function getIdFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1].split("?")[0];
}

// GET /api/admin/newsletters/:id - Get single newsletter
export async function GET(request: NextRequest) {
  const rl = checkRateLimit(request, 30);
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

    const id = getIdFromUrl(request.url);

    const newsletter = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!newsletter) {
      return errorResponse("Newsletter not found", 404);
    }

    return NextResponse.json(newsletter);
  } catch (error) {
    console.error("Get newsletter error:", error);
    return errorResponse("Failed to fetch newsletter", 500);
  }
}

// PATCH /api/admin/newsletters/:id - Update newsletter
export async function PATCH(request: NextRequest) {
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

    const id = getIdFromUrl(request.url);
    const body = await request.json();
    const { subject, content, previewText, scheduledAt } = body;

    // Check if newsletter exists
    const existing = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!existing) {
      return errorResponse("Newsletter not found", 404);
    }

    // Cannot edit sent newsletters
    if (existing.isSent) {
      return errorResponse("Cannot edit a newsletter that has already been sent", 400);
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (subject !== undefined) {
      updateData.subject = subject.trim();
    }

    if (content !== undefined) {
      updateData.content = content.trim();
    }

    if (previewText !== undefined) {
      updateData.previewText = previewText?.trim() || null;
    }

    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    }

    const newsletter = await prisma.newsletter.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Newsletter updated successfully",
      newsletter,
    });
  } catch (error) {
    console.error("Update newsletter error:", error);
    return errorResponse("Failed to update newsletter", 500);
  }
}

// DELETE /api/admin/newsletters/:id - Delete newsletter
export async function DELETE(request: NextRequest) {
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

    const id = getIdFromUrl(request.url);

    const newsletter = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!newsletter) {
      return errorResponse("Newsletter not found", 404);
    }

    await prisma.newsletter.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Newsletter deleted successfully",
    });
  } catch (error) {
    console.error("Delete newsletter error:", error);
    return errorResponse("Failed to delete newsletter", 500);
  }
}
