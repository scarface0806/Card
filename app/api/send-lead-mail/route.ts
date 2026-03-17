import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/lib/responses";
import { sendEmail } from "@/lib/email";

const sendLeadMailSchema = z.object({
  to: z.string().email(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  subject: z.string().optional(),
  message: z.string().min(1),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body. Please send valid JSON.", 400);
    }

    const parsed = sendLeadMailSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map((issue) => issue.message).join(", "), 400);
    }

    const leadSubject = parsed.data.subject?.trim() || "New contact enquiry";

    const html = `
      <h2>New Lead Message</h2>
      <p><strong>Name:</strong> ${parsed.data.name}</p>
      <p><strong>Email:</strong> ${parsed.data.email}</p>
      <p><strong>Phone:</strong> ${parsed.data.phone}</p>
      <p><strong>Subject:</strong> ${leadSubject}</p>
      <p><strong>Message:</strong></p>
      <p>${parsed.data.message.replace(/\n/g, "<br>")}</p>
    `;

    const text = `Name: ${parsed.data.name}\nEmail: ${parsed.data.email}\nPhone: ${parsed.data.phone}\nSubject: ${leadSubject}\nMessage: ${parsed.data.message}`;

    const sent = await sendEmail({
      to: parsed.data.to,
      subject: leadSubject,
      html,
      text,
    });

    if (!sent) {
      return errorResponse("Failed to send lead email", 500);
    }

    return successResponse({ message: "Lead email sent" });
  } catch (error) {
    console.error("[Lead Mail] POST error:", error);
    return errorResponse("Failed to send lead email", 500);
  }
}
