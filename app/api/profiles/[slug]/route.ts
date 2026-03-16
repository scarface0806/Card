import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/responses";

// GET /api/profiles/[slug] - Get profile by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Find card by slug and project profile-like response.
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
      return errorResponse("Profile not found", 404);
    }

    if (!card.isActive) {
      return errorResponse("Profile is not active", 410);
    }

    const customerName = [card.details?.firstName, card.details?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || card.user?.name || "Card Owner";

    return successResponse({
      message: "Profile found successfully",
      profile: {
        id: card.id,
        slug: card.slug,
        customerName,
        designation: card.details?.title || null,
        company: card.details?.company || null,
        phone: card.details?.phone || null,
        email: card.details?.email || card.user?.email || null,
        website: card.details?.website || null,
        address: null,
        profileData: card.details || null,
        isActive: card.isActive,
        createdAt: card.createdAt,
        order: null,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return errorResponse("Failed to fetch profile", 500);
  }
}

// POST /api/profiles/[slug]/contact - Send message to profile owner
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();

    // Find card
    const card = await prisma.card.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!card) {
      return errorResponse("Profile not found", 404);
    }

    if (!card.isActive) {
      return errorResponse("Profile is not active", 410);
    }

    // Validate required fields
    const { name, email, message } = body;
    if (!name || !email || !message) {
      return errorResponse("Name, email, and message are required", 400);
    }

    // Create lead record (optional - for tracking)
    await prisma.cardLead.create({
      data: {
        cardId: card.id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: body.phone?.trim() || null,
        company: body.company?.trim() || null,
        message: message.trim(),
        source: "profile_contact",
        ipAddress: request.headers.get("x-forwarded-for") || 
                 request.headers.get("x-real-ip") || 
                 "unknown",
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    // Send email notification to profile/card owner
    const ownerEmail = card.user?.email || card.details?.email;
    const ownerName = [card.details?.firstName, card.details?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() || card.user?.name || "Card Owner";

    if (ownerEmail) {
      const { sendEmail } = await import("@/lib/email");
      const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://tapvyo.com"}/card/${slug}`;
      
      const subject = `New Message from Your NFC Profile - ${name}`;
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Message from Your NFC Profile</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">New Message! 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${ownerName},
              </p>
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Someone just sent you a message through your NFC profile!
              </p>
              
              <!-- Message Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">From</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 500;">${name}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Email</span><br>
                          <a href="mailto:${email}" style="color: #06b6d4; font-size: 16px; font-weight: 500; text-decoration: none;">${email}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Phone</span><br>
                          <span style="color: #111827; font-size: 16px; font-weight: 500;">${body.phone || 'Not provided'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Message</span><br>
                          <p style="margin: 8px 0 0; color: #374151; font-size: 14px; line-height: 1.6; background-color: #ffffff; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">${message.replace(/\n/g, '<br>')}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 24px; color: #374151; font-size: 14px; line-height: 1.6;">
                View your profile: <a href="${profileUrl}" style="color: #06b6d4; text-decoration: none; font-weight: 600;">${profileUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This message was sent from your NFC profile at ${new Date().toLocaleString()}
              </p>
              <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                © ${new Date().getFullYear()} Tapvyo NFC Business Cards
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      const text = `
New Message from Your NFC Profile!

Hi ${ownerName},

Someone just sent you a message through your NFC profile!

From: ${name}
Email: ${email}
Phone: ${body.phone || 'Not provided'}
Message: ${message}

View your profile: ${profileUrl}

© ${new Date().getFullYear()} Tapvyo NFC Business Cards
      `;

      await sendEmail({
        to: ownerEmail,
        subject,
        html,
        text,
      }).catch((emailError) => {
        console.error("Profile contact email failed:", emailError);
      });
    }

    return successResponse({
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Profile contact error:", error);
    return errorResponse("Failed to send message", 500);
  }
}
