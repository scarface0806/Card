import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { withRateLimit } from "@/lib/rate-limit";
import { AuthUser } from "@/lib/auth";
import { CardStatus } from "@prisma/client";

import { updateCardSchema } from "@/lib/validators";
import { errorResponse } from "@/lib/responses";

// Helper to extract ID from URL
function getIdFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1].split("?")[0];
}

// PUT /api/admin/cards/:id - Update card status (admin only)
async function handler(request: NextRequest, user: AuthUser) {
  try {
    const id = getIdFromUrl(request.url);
    const body = await request.json();
    const parsed = updateCardSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e=>e.message).join(", "), 400);
    }
    const { status } = parsed.data;

    if (status && !["ACTIVE", "INACTIVE"].includes(status as string)) {
      return errorResponse("Invalid status. Allowed: ACTIVE, INACTIVE", 400);
    }

    const existingCard = await prisma.card.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingCard) {
      return errorResponse("Card not found", 404);
    }

    const updatedCard = await prisma.card.update({
      where: { id },
      data: { status: status as CardStatus },
      select: {
        id: true,
        slug: true,
        userId: true,
        status: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Card updated successfully",
      card: updatedCard,
    });
  } catch (error) {
    console.error("Admin update card error:", error);
    return NextResponse.json(
      { error: "Failed to update card" },
      { status: 500 }
    );
  }
}

export const PUT = withRateLimit(withAdmin(handler), 30);
