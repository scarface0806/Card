import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { AuthUser } from "@/lib/auth";

import { z } from "zod";
import { withRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";

// simple schema for updating status
const customerStatusSchema = z.object({ isActive: z.boolean() });

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/admin/customers/:id - Update customer (admin only)
async function handler(request: NextRequest, user: AuthUser, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = customerStatusSchema.safeParse(body);
    if (!parsed.success) {
      const errors = parsed.error.issues.map((issue) => issue.message).join(", ");
      return errorResponse(errors, 400);
    }
    const { isActive } = parsed.data;

    // Prevent admin from deactivating themselves
    if (user.id === id && isActive === false) {
      return errorResponse("You cannot deactivate your own account", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      return errorResponse("User not found", 404);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse({
      message: "Customer updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    return errorResponse("Failed to update customer", 500);
  }
}

export const PUT = withRateLimit(withAdmin(handler), 20);
