import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/responses";

// Helper to extract slug from URL
function getSlugFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1].split("?")[0];
}

// GET /api/cards/:slug - Get card by slug (public)
export async function GET(request: NextRequest) {
  try {
    const slug = getSlugFromUrl(request.url);
    const { searchParams } = new URL(request.url);
    const incrementView = searchParams.get("view") !== "false";

    // Find card by slug
    const card = await prisma.card.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!card) {
      return errorResponse("Card not found", 404);
    }

    // Check if card is active
    if (!card.isActive) {
      return errorResponse("This card is no longer active", 410);
    }

    // Check if card has expired
    if (card.expiresAt && new Date(card.expiresAt) < new Date()) {
      return errorResponse("This card has expired", 410);
    }

    // Increment view count if requested
    if (incrementView) {
      await prisma.card.update({
        where: { id: card.id },
        data: { views: { increment: 1 } },
      });
    }

    return NextResponse.json({
      id: card.id,
      slug: card.slug,
      cardType: card.cardType,
      status: card.status,
      details: card.details,
      views: card.views + (incrementView ? 1 : 0),
      taps: card.taps,
      createdAt: card.createdAt,
    });
  } catch (error) {
    console.error("Get card error:", error);
    return errorResponse("Failed to fetch card", 500);
  }
}

// POST /api/cards/:slug/tap - Record NFC tap
export async function POST(request: NextRequest) {
  try {
    const slug = getSlugFromUrl(request.url);

    const card = await prisma.card.findUnique({
      where: { slug },
    });

    if (!card) {
      return errorResponse("Card not found", 404);
    }

    if (!card.isActive) {
      return errorResponse("This card is no longer active", 410);
    }

    // Increment tap count and update lastTapped
    await prisma.card.update({
      where: { id: card.id },
      data: {
        taps: { increment: 1 },
        lastTapped: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Tap recorded",
    });
  } catch (error) {
    console.error("Record tap error:", error);
    return NextResponse.json(
      { error: "Failed to record tap" },
      { status: 500 }
    );
  }
}
