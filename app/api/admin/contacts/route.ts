import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { withRateLimit } from "@/lib/rate-limit";
import { AuthUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/responses";

// GET /api/admin/contacts - List contact leads (admin only)
async function getContactsHandler(request: NextRequest, user: AuthUser) {
  try {
    const { searchParams } = new URL(request.url);

    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim();
    const unread = searchParams.get("unread") === "true";

    const where: Record<string, unknown> = {};

    if (unread) {
      where.isRead = false;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
      ];
    }

    const [contacts, total, unreadCount] = await Promise.all([
      prisma.cardLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          card: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
      }),
      prisma.cardLead.count({ where }),
      prisma.cardLead.count({ where: { isRead: false } }),
    ]);

    return successResponse({
      contacts,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorResponse("Failed to fetch contacts", 500);
  }
}

// PATCH /api/admin/contacts - Update read/unread state (admin only)
async function patchContactsHandler(request: NextRequest, user: AuthUser) {
  try {
    const body = await request.json();
    const id = typeof body?.id === "string" ? body.id : "";
    const isRead = typeof body?.isRead === "boolean" ? body.isRead : null;

    if (!id || isRead === null) {
      return errorResponse("id and isRead are required", 400);
    }

    const contact = await prisma.cardLead.update({
      where: { id },
      data: { isRead },
      select: { id: true, isRead: true },
    });

    return successResponse({
      message: `Contact marked as ${isRead ? "read" : "unread"}`,
      contact,
    });
  } catch (error) {
    return errorResponse("Failed to update contact", 500);
  }
}

// DELETE /api/admin/contacts?id=... - Remove contact lead (admin only)
async function deleteContactsHandler(request: NextRequest, user: AuthUser) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("Contact id is required", 400);
    }

    await prisma.cardLead.delete({ where: { id } });

    return successResponse({ message: "Contact deleted successfully" });
  } catch (error) {
    return errorResponse("Failed to delete contact", 500);
  }
}

export const GET = withRateLimit(withAdmin(getContactsHandler), 60);
export const PATCH = withRateLimit(withAdmin(patchContactsHandler), 30);
export const DELETE = withRateLimit(withAdmin(deleteContactsHandler), 30);
