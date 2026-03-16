import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { Role } from "@prisma/client";
import { errorResponse, successResponse } from "@/lib/responses";
import { z } from "zod";

const updateAccountSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  avatar: z.string().optional(),
});

// GET /api/admin/account - Get current admin profile
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        updatedAt: true,
      },
    });

    if (!dbUser) {
      return errorResponse("User not found", 404);
    }

    return successResponse({ user: dbUser });
  } catch (error) {
    return errorResponse("Failed to fetch account details", 500);
  }
}

// PUT /api/admin/account - Update current admin profile
export async function PUT(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const parsed = updateAccountSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map((e) => e.message).join(", "), 400);
    }

    const { name, email, avatar } = parsed.data;

    const existing = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        NOT: { id: user.id },
      },
      select: { id: true },
    });

    if (existing) {
      return errorResponse("Email is already in use", 409);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        avatar: avatar?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        updatedAt: true,
      },
    });

    return successResponse({
      message: "Account updated successfully",
      user: updated,
    });
  } catch (error) {
    return errorResponse("Failed to update account", 500);
  }
}
