import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { Role } from "@prisma/client";

import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";

// simplified schema covering most fields
const cardDetailsSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  designation: z.string().min(1).optional(),
  phone: z.string().min(10).optional(),
  email: z.string().email().optional(),
  socialLinks: z.record(z.string(), z.string().nullable()).optional(),
});

// Validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string): boolean {
  // Allow various phone formats (at least 10 digits)
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

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/card/:id/details - Update card details (Admin or card owner only)
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const rl = checkRateLimit(request, 50);
    if (!rl.ok) {
      const res = errorResponse("Too many requests", 429);
      if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
      return res;
    }

    const { user, error } = await authenticate(request);
    const { id } = await params;

    if (!user) {
      return errorResponse(error || "Unauthorized", 401);
    }

    // Get the card to check ownership
    const card = await prisma.card.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        details: true,
      },
    });

    if (!card) {
      return NextResponse.json(
        { error: "Card not found" },
        { status: 404 }
      );
    }

    // Check authorization: Admin or card owner
    const isAdmin = user.role === Role.ADMIN;
    const isOwner = card.userId === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const parsed = cardDetailsSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e => e.message).join(", "), 400);
    }
    const {
      firstName,
      lastName,
      designation,
      phone,
      email,
      socialLinks,
    } = parsed.data;

    // Build updated details - start with existing
    const updatedDetails = { ...card.details };

    // Validate and update firstName
    if (firstName !== undefined) {
      updatedDetails.firstName = firstName.trim();
    }

    // Validate and update lastName
    if (lastName !== undefined) {
      updatedDetails.lastName = lastName.trim();
    }
    // (duplicate earlier) lastName already trimmed by schema
    if (lastName !== undefined) {
      updatedDetails.lastName = lastName.trim();
    }

    // Validate and update title (designation)
    if (designation !== undefined) {
      updatedDetails.title = designation.trim();
    }

    // Validate and update phone
    if (phone !== undefined) {
      if (!validatePhone(phone)) {
        return errorResponse("phone must be a valid phone number (min 10 digits)", 400);
      }
      updatedDetails.phone = phone.trim();
    }

    // Validate and update email
    if (email !== undefined) {
      if (!validateEmail(email)) {
        return errorResponse("email must be a valid email address", 400);
      }
      updatedDetails.email = email.trim();
    }

    // Validate and update socialLinks
    if (socialLinks !== undefined) {
      if (typeof socialLinks !== "object" || socialLinks === null) {
        return errorResponse("socialLinks must be an object", 400);
      }

      const allowedSocials = [
        "linkedin",
        "twitter",
        "facebook",
        "instagram",
        "youtube",
        "tiktok",
        "github",
        "whatsapp",
        "telegram",
        "snapchat",
      ];

      // Validate each social link
      for (const [key, value] of Object.entries(socialLinks)) {
        if (!allowedSocials.includes(key)) {
          return errorResponse(`Invalid social platform: ${key}. Allowed: ${allowedSocials.join(", ")}`, 400);
        }

        if (value !== null && value !== undefined) {
          if (typeof value !== "string") {
            return errorResponse(`${key} must be a string or null`, 400);
          }

          // Basic validation: ensure it's not empty string
          if (value.trim().length === 0 && value !== null) {
              return errorResponse(`${key} cannot be empty`, 400);
          }

          // Validate URL format for URL-based socials if it looks like a URL
          const urlSocials = ["linkedin", "twitter", "github", "youtube"];
          if (urlSocials.includes(key) && value && value.startsWith("http")) {
            if (!validateUrl(value)) {
              return errorResponse(`${key} must be a valid URL`, 400);
            }
          }
        }
      }

      // Merge social links with existing ones
      const cleanedSocialLinks = Object.fromEntries(
        Object.entries(socialLinks).filter(([, v]) => v != null)
      );
      updatedDetails.socialLinks = {
        ...(updatedDetails.socialLinks || {}),
        ...cleanedSocialLinks,
      } as any;
    }

    // Update card in database
    const updatedCard = await prisma.card.update({
      where: { id },
      data: {
        details: updatedDetails,
      },
      select: {
        id: true,
        slug: true,
        userId: true,
        cardType: true,
        status: true,
        details: true,
        views: true,
        taps: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(
      {
        message: "Card details updated successfully",
        card: updatedCard,
      },
      200
    );
  } catch (error) {
    console.error("Update card details error:", error);
    return errorResponse("Failed to update card details", 500);
  }
}
