import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { withRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";
import type { AuthUser } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

type MainWebsiteLeadDocument = {
  _id: ObjectId;
  source?: string;
  name?: string;
  phone?: string;
  email?: string | null;
  subject?: string | null;
  message?: string | null;
  service?: string | null;
  createdAt?: Date;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isMongoConnectivityError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    message?: string;
    name?: string;
    code?: string | number;
  };

  const message = (candidate.message || "").toLowerCase();
  const name = (candidate.name || "").toLowerCase();
  const code = String(candidate.code || "").toLowerCase();

  return (
    message.includes("server selection timeout") ||
    message.includes("failed to connect") ||
    message.includes("authentication failed") ||
    name.includes("mongoserverselectionerror") ||
    code === "p1001" ||
    code === "p1002"
  );
}

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

    const db = await getMongoDb();
    const collection = db.collection<MainWebsiteLeadDocument>("main_website_leads");

    const filter = search
      ? {
          $or: [
            { name: { $regex: escapeRegex(search), $options: "i" } },
            { phone: { $regex: escapeRegex(search), $options: "i" } },
            { email: { $regex: escapeRegex(search), $options: "i" } },
            { subject: { $regex: escapeRegex(search), $options: "i" } },
            { message: { $regex: escapeRegex(search), $options: "i" } },
            { service: { $regex: escapeRegex(search), $options: "i" } },
          ],
        }
      : {};

    const [mongoLeads, total] = await Promise.all([
      collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
    ]);

    const leads = mongoLeads.map((lead) => ({
      id: lead._id.toString(),
      source: lead.source || "main-website",
      name: lead.name || "",
      phone: lead.phone || "",
      email: lead.email || null,
      subject: lead.subject || null,
      message: lead.message || null,
      service: lead.service || null,
      createdAt: lead.createdAt || new Date(0),
    }));

    return successResponse({
      type,
      data: leads,
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (isMongoConnectivityError(error)) {
      console.error("Get admin leads Mongo connectivity error:", error);
      return errorResponse("Database connection failed while fetching website leads", 503);
    }

    console.error("Get admin leads error:", error);
    return errorResponse("Failed to fetch leads from main_website_leads", 500);
  }
}

export const GET = withRateLimit(withAdmin(getHandler), 60);