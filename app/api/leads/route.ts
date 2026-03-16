import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { customerLeadSchema } from "@/lib/validators";
import { errorResponse, successResponse } from "@/lib/responses";
import { sendCustomerLeadNotificationEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const rl = checkRateLimit(request, 5);
    if (!rl.ok) {
      const response = errorResponse("Too many submissions. Please try again shortly.", 429);
      if (rl.retryAfter) {
        response.headers.set("Retry-After", String(rl.retryAfter));
      }
      return response;
    }

    const body = await request.json();
    const parsed = customerLeadSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map((issue) => issue.message).join(", "), 400);
    }

    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: {
        id: true,
        name: true,
        email: true,
        slug: true,
      },
    });

    if (!customer) {
      return errorResponse("Customer profile not found", 404);
    }

    const lead = await prisma.lead.create({
      data: {
        customerId: customer.id,
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        message: parsed.data.message,
      },
    });

    if (customer.email && !parsed.data.skipEmail) {
      try {
        await sendCustomerLeadNotificationEmail({
          to: customer.email,
          customerName: customer.name,
          customerSlug: customer.slug,
          visitorName: parsed.data.name,
          visitorPhone: parsed.data.phone,
          visitorMessage: parsed.data.message,
          visitorEmail: parsed.data.email || undefined,
        });
      } catch (error) {
        console.error("Customer lead email failed:", error);
      }
    }

    return successResponse({
      message: "Message sent successfully",
      leadId: lead.id,
    }, 201);
  } catch (error) {
    console.error("Create lead error:", error);
    return errorResponse("Failed to submit lead", 500);
  }
}