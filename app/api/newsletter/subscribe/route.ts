import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  source: z.string().optional(),
  website: z.string().optional(), // honeypot field
});

// POST /api/newsletter/subscribe - Subscribe to newsletter (Public)
export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0].trim() || "unknown";
    const rl = checkRateLimit(request, 10);
    if (!rl.ok) {
      const res = errorResponse("Too many requests. Please try again later.", 429);
      if (rl.retryAfter) res.headers.set("Retry-After", String(rl.retryAfter));
      return res;
    }

    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e => e.message).join(", "), 400);
    }
    const { email, name, source, website } = parsed.data;

    // Honeypot check
    if (website) {
      return successResponse({ message: "Successfully subscribed to our newsletter!" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      if (existing.isActive) {
        return successResponse({ message: "You're already subscribed to our newsletter!" });
      }

      await prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: { isActive: true },
      });

      return successResponse({ message: "Welcome back! You've been re-subscribed to our newsletter." });
    }

    // Create new subscriber
    await prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        name: name?.trim() || null,
        source: source || "website",
        isActive: true,
      },
    });

    return successResponse({ message: "Successfully subscribed to our newsletter!" });
  } catch (error) {
    console.error("Subscribe error:", error);
    return errorResponse("Failed to subscribe", 500);
  }
}

// DELETE /api/newsletter/subscribe - Unsubscribe from newsletter (Public)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token"); // Optional: for secure unsubscribe links

    if (!email) {
      return errorResponse("Email is required", 400);
    }

    const normalizedEmail = email.toLowerCase().trim();

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (!subscriber) {
      return successResponse({ message: "You have been unsubscribed." });
    }

    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: { isActive: false },
    });

    return successResponse({ message: "You have been successfully unsubscribed from our newsletter." });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return errorResponse("Failed to unsubscribe", 500);
  }
}
