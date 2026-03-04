import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { Role } from "@prisma/client";
import { sendBulkNewsletter, isEmailConfigured } from "@/lib/email";

// Helper to extract ID from URL - URL format: /api/admin/newsletters/[id]/send
function getIdFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 2]; // Get [id] from /[id]/send
}

// POST /api/admin/newsletters/:id/send - Send newsletter to all subscribers
export async function POST(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (!user || user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: error || "Admin access required" },
        { status: 403 }
      );
    }

    // Check if email is configured
    if (!isEmailConfigured()) {
      return NextResponse.json(
        { 
          error: "Email is not configured. Please set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables." 
        },
        { status: 400 }
      );
    }

    const id = getIdFromUrl(request.url);

    // Get newsletter
    const newsletter = await prisma.newsletter.findUnique({
      where: { id },
    });

    if (!newsletter) {
      return NextResponse.json(
        { error: "Newsletter not found" },
        { status: 404 }
      );
    }

    if (newsletter.isSent) {
      return NextResponse.json(
        { error: "This newsletter has already been sent" },
        { status: 400 }
      );
    }

    // Get all active subscribers
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { isActive: true },
      select: { email: true },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "No active subscribers found" },
        { status: 400 }
      );
    }

    // Send newsletter to all subscribers
    const result = await sendBulkNewsletter(
      {
        subject: newsletter.subject,
        content: newsletter.content,
        previewText: newsletter.previewText || undefined,
        newsletterId: newsletter.id,
      },
      subscribers,
      10, // Batch size
      1000 // Delay between batches (ms)
    );

    // Update newsletter with send stats
    await prisma.newsletter.update({
      where: { id },
      data: {
        isSent: true,
        sentAt: new Date(),
        sentCount: result.sent,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Newsletter sent successfully to ${result.sent} subscribers`,
      stats: {
        total: result.total,
        sent: result.sent,
        failed: result.failed,
      },
      errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined, // Return first 10 errors
    });
  } catch (error) {
    console.error("Send newsletter error:", error);
    return NextResponse.json(
      { error: "Failed to send newsletter" },
      { status: 500 }
    );
  }
}
