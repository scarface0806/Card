import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { Role } from "@prisma/client";
import { errorResponse, successResponse } from "@/lib/responses";
import { verifyPassword, hashPassword, isStrongPassword } from "@/lib/auth";
import { z } from "zod";

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
});

// POST /api/admin/security/password - Change admin password
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);
    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const parsed = passwordSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map((e) => e.message).join(", "), 400);
    }

    const { currentPassword, newPassword, confirmPassword } = parsed.data;

    if (newPassword !== confirmPassword) {
      return errorResponse("New password and confirm password must match", 400);
    }

    const strength = isStrongPassword(newPassword);
    if (!strength.valid) {
      return errorResponse(strength.message || "Password is too weak", 400);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, password: true, isActive: true },
    });

    if (!dbUser || !dbUser.isActive) {
      return errorResponse("User not found or inactive", 404);
    }

    if (!dbUser.password) {
      return errorResponse("Password login is not enabled for this account", 400);
    }

    const isCurrentValid = await verifyPassword(currentPassword, dbUser.password);
    if (!isCurrentValid) {
      return errorResponse("Current password is incorrect", 401);
    }

    const isSameAsOld = await verifyPassword(newPassword, dbUser.password);
    if (isSameAsOld) {
      return errorResponse("New password must be different from current password", 400);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return successResponse({ message: "Password changed successfully" });
  } catch (error) {
    return errorResponse("Failed to update password", 500);
  }
}
