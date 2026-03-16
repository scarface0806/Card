import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { withRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import type { AuthUser } from "@/lib/auth";

async function getHandler(request: NextRequest, user: AuthUser) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") || "50", 10);
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;
    const skip = (page - 1) * limit;
    const search = searchParams.get("search")?.trim();
    const type = searchParams.get("type") === "nfc" ? "nfc" : "main";

    if (type === "nfc") {
      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
              { message: { contains: search, mode: "insensitive" as const } },
              { customer: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {};

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        }),
        prisma.lead.count({ where }),
      ]);

      return successResponse({
        type,
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { subject: { contains: search, mode: "insensitive" as const } },
            { message: { contains: search, mode: "insensitive" as const } },
            { service: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const mainLeadDelegate =
      prisma as unknown as {
        mainWebsiteLead: {
          findMany: (args: unknown) => Promise<unknown[]>;
          count: (args: unknown) => Promise<number>;
        };
      };

    const [leads, total] = await Promise.all([
      mainLeadDelegate.mainWebsiteLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      mainLeadDelegate.mainWebsiteLead.count({ where }),
    ]);

    return successResponse({
      type,
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin leads error:", error);
    return errorResponse("Failed to fetch leads", 500);
  }
}

export const GET = withRateLimit(withAdmin(getHandler), 60);