import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/responses";
import type { AuthUser } from "@/lib/auth";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

type CustomerDetailDelegate = {
  findUnique: (args: unknown) => Promise<{
    id: string;
    name: string;
    designation: string | null;
    company: string | null;
    about: string | null;
    phone: string;
    email: string;
    mailApiEndpoint: string | null;
    website: string | null;
    websiteEnabled: boolean;
    linkedin: string | null;
    linkedinEnabled: boolean;
    whatsapp: string | null;
    whatsappEnabled: boolean;
    instagram: string | null;
    instagramEnabled: boolean;
    facebook: string | null;
    facebookEnabled: boolean;
    behance: string | null;
    behanceEnabled: boolean;
    address: string | null;
    mapEmbedUrl: string | null;
    logo: string | null;
    profileImage: string | null;
    isActive: boolean;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
    galleries: Array<{
      id: string;
      slot: number;
      image: string;
      hoverText: string | null;
    }>;
    leads: Array<{
      id: string;
      name: string;
      email: string | null;
      phone: string;
      message: string;
      createdAt: Date;
    }>;
  } | null>;
};

async function getHandler(request: NextRequest, user: AuthUser, context: RouteParams) {
  try {
    const customerDelegate = (prisma as unknown as { customer: CustomerDetailDelegate }).customer;
    const { id } = await context.params;

    const customer = await customerDelegate.findUnique({
      where: { id },
      include: {
        galleries: {
          orderBy: { slot: "asc" },
        },
        leads: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!customer) {
      return errorResponse("Customer not found", 404);
    }

    return successResponse({ customer });
  } catch (error) {
    console.error("Get customer by id error:", error);
    return errorResponse("Failed to fetch customer", 500);
  }
}

export const GET = withAdmin(getHandler);
