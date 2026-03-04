import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidEmail } from "@/lib/auth";
import { sendLeadNotificationEmail } from "@/lib/email";

import { leadSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";

// rate limiting using shared helper
// the shared `checkRateLimit` function imported above will be used inside POST handler

// Helper to extract slug from URL
function getSlugFromUrl(url: string): string {
  const parts = url.split("/");
  // URL format: /api/cards/[slug]/leads
  return parts[parts.length - 2];
}

// POST /api/cards/:slug/leads - Submit a lead/contact form
export async function POST(request: NextRequest) {
  try {
    const slug = getSlugFromUrl(request.url);

    // Get IP for rate limiting
    const rl = checkRateLimit(request, 3);
    if (!rl.ok) {
      const res = errorResponse("Too many submissions. Please try again later.", 429);
      if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
      return res;
    }

    // Find the card
    const card = await prisma.card.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    });

    if (!card) {
      return errorResponse("Card not found", 404);
    }

    if (!card.isActive) {
      return errorResponse("This card is no longer active", 410);
    }

    const body = await request.json();
    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e=>e.message).join(", "), 400);
    }
    const { name, email, phone, company, message, source, website } = parsed.data;

    // Honeypot check - if hidden field is filled, it's a bot
    if (website) {
      return successResponse({ message: "Thank you for your message!" });
    }

    // Get user agent
    const userAgent = request.headers.get("user-agent") || undefined;
    
    // Get IP address
    const ip =
      (request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")) ??
      "unknown";

    // Create the lead
    const lead = await prisma.cardLead.create({
      data: {
        cardId: card.id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        message: message?.trim() || null,
        source: source || "contact_form",
        ipAddress: ip !== "unknown" ? ip : null,
        userAgent: userAgent,
      },
    });

    // Send email notification to card owner
    const ownerEmail = card.user?.email || card.details?.email;
    if (ownerEmail) {
      try {
        await sendLeadNotificationEmail({
          to: ownerEmail,
          cardOwnerName: card.user?.name || card.details?.firstName || "Card Owner",
          leadName: name.trim(),
          leadEmail: email.trim(),
          leadPhone: phone?.trim(),
          leadCompany: company?.trim(),
          leadMessage: message?.trim(),
          cardSlug: card.slug,
        });
      } catch (emailError) {
        // Log but don't fail the request if email fails
        console.error("Failed to send lead notification email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Thank you for your message! We'll get back to you soon.",
      leadId: lead.id,
    });
  } catch (error) {
    console.error("Submit lead error:", error);
    return errorResponse("Failed to submit message", 500);
  }
}

// GET /api/cards/:slug/leads - Get leads for a card (owner only)
export async function GET(request: NextRequest) {
  try {
    const slug = getSlugFromUrl(request.url);
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const unreadOnly = searchParams.get("unread") === "true";

    // Find the card
    const card = await prisma.card.findUnique({
      where: { slug },
    });

    if (!card) {
      return errorResponse("Card not found", 404);
    }

    // Build where clause
    const where: Record<string, unknown> = { cardId: card.id };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [leads, total] = await Promise.all([
      prisma.cardLead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.cardLead.count({ where }),
    ]);

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get leads error:", error);
    return errorResponse("Failed to fetch leads", 500);
  }
}
