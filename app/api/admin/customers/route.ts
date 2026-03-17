import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { AuthUser } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/responses";

type CustomerAdminDelegate = {
  findMany: (args: unknown) => Promise<any[]>;
  count: (args: unknown) => Promise<number>;
};

// GET /api/admin/customers - Get all customers (admin only)
async function handler(request: NextRequest, user: AuthUser) {
  try {
    const customerDelegate = (prisma as unknown as { customer: CustomerAdminDelegate }).customer;
    const origin = request.nextUrl.origin;
    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get("page") || "1");
    const rawLimit = parseInt(searchParams.get("limit") || "50");
    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 200) : 50;
    const skip = (page - 1) * limit;

    const search = searchParams.get("search")?.trim();

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { company: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { slug: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [customers, total] = await Promise.all([
      customerDelegate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              galleries: true,
              leads: true,
            },
          },
        },
      }),
      customerDelegate.count({ where }),
    ]);

    const data = customers.map((customer: Awaited<typeof customers>[number]) => ({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      designation: customer.designation,
      company: customer.company,
      slug: customer.slug,
      logo: customer.logo,
      profileImage: customer.profileImage,
      isActive: customer.isActive,
      status: customer.isActive ? "Active" : "Disabled",
      createdAt: customer.createdAt,
      totalGalleryImages: customer._count.galleries,
      totalLeads: customer._count.leads,
      nfcLink: `${origin}/card/${customer.slug}`,
    }));

    return successResponse({
      customers: data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get customers error:", error);
    return errorResponse("Failed to fetch customers", 500);
  }
}

export const GET = withAdmin(handler);
