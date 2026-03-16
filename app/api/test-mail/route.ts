import { NextRequest } from "next/server";
import { z } from "zod";
import { errorResponse, successResponse } from "@/lib/responses";
import { sendEmail } from "@/lib/email";

const testMailSchema = z.object({
  customerName: z.string().min(1),
  customerEmail: z.string().email(),
  mailApiKey: z.string().min(1),
});

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = testMailSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map((issue) => issue.message).join(", "), 400);
    }

    const subject = "Tapvyo NFC Mail API Test";
    const message = "This is a test email to confirm your Mail API is working correctly.";

    const sent = await sendEmail({
      to: parsed.data.customerEmail,
      subject,
      html: `<p>Hi ${parsed.data.customerName},</p><p>${message}</p><p><strong>Mail API Key:</strong> ${parsed.data.mailApiKey}</p>`,
      text: `Hi ${parsed.data.customerName},\n\n${message}\n\nMail API Key: ${parsed.data.mailApiKey}`,
    });

    if (!sent) {
      return errorResponse("Mail API test failed", 500, {
        message: "Unable to send test email. Check SMTP configuration and Mail API key.",
      });
    }

    return successResponse({
      success: true,
      message: "Mail API verified successfully.",
    });
  } catch (error) {
    console.error("Test mail error:", error);
    return errorResponse("Mail API test failed", 500, { message: "Internal server error" });
  }
}
