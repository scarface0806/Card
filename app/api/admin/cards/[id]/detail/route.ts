import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { withRateLimit } from "@/lib/rate-limit";
import { AuthUser } from "@/lib/auth";

import { updateCardSchema } from "@/lib/validators";
import { errorResponse, successResponse } from "@/lib/responses";
import { deleteCloudinaryImage, extractCloudinaryPublicIdFromUrl } from "@/lib/deleteCloudinaryImage";

type RouteParams = { params: Promise<{ id: string }> };

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// PUT /api/admin/cards/:id/detail - Update card detail (admin only)
async function handler(
  request: NextRequest,
  user: AuthUser,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const parsed = updateCardSchema.safeParse(await request.json());
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e => e.message).join(", "), 400);
    }
    const data = parsed.data;
    const imageUrl = typeof (data as { imageUrl?: unknown }).imageUrl === "string"
      ? String((data as { imageUrl?: string }).imageUrl).trim()
      : "";

    const card = await prisma.card.findUnique({
      where: { id },
      select: { id: true, details: true },
    });

    if (!card) {
      return errorResponse("Card not found", 404);
    }

    const previousProfileImage = (card.details as { profileImage?: string } | null)?.profileImage || "";
    const updatedDetails = {
      ...card.details,
      ...(data.details || {}),
      ...(imageUrl ? { profileImage: imageUrl } : {}),
    };
    
    // Filter out null/undefined values for Prisma compatibility
    const cleanedDetails = Object.fromEntries(
      Object.entries(updatedDetails).filter(([, v]) => v != null)
    );

    const updatedCard = await prisma.card.update({
      where: { id },
      data: { details: cleanedDetails as any },
      select: {
        id: true,
        slug: true,
        details: true,
        updatedAt: true,
      },
    });

    const nextProfileImage = (updatedCard.details as { profileImage?: string } | null)?.profileImage || "";
    if (previousProfileImage && previousProfileImage !== nextProfileImage) {
      const oldPublicId = extractCloudinaryPublicIdFromUrl(previousProfileImage);
      if (oldPublicId) {
        void deleteCloudinaryImage(oldPublicId).catch((cleanupError) => {
          console.error("Failed to cleanup old card profile image:", cleanupError);
        });
      }
    }

    return successResponse({
      message: "Card detail updated successfully",
      detail: updatedCard.details,
      cardId: updatedCard.id,
      updatedAt: updatedCard.updatedAt,
    });
  } catch (error) {
    console.error("Admin update card detail error:", error);
    return errorResponse("Failed to update card detail", 500);
  }
}

export const PUT = withRateLimit(withAdmin(handler), 30);
