import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withAdmin } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/responses";
import { generateProfileSlug } from "@/lib/slug-generator";
import { sendEmail } from "@/lib/email";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { APP_URL, SUPPORT_EMAIL } from "@/utils/constants";

/** Order statuses at which a paid order may get its profile. */
const PROFILE_ELIGIBLE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
]);

// POST /api/admin/profiles - Create profile from order
async function createProfileHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return errorResponse("Order ID is required", 400);
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
      },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    // Eligibility: the order must be confirmed or further along AND paid.
    // Status alone was not enough - an unpaid order that reached CONFIRMED
    // (by mistake, or by a customer before the PUT /api/orders/:id fix) got a
    // live profile with no money collected.
    if (!PROFILE_ELIGIBLE_STATUSES.has(order.status) || order.paymentStatus !== PaymentStatus.PAID) {
      return errorResponse("Order is not eligible for profile creation", 409);
    }

    // One profile per order. Card has no order field; Order.cardId is the
    // link. (The old check compared a CARD id with this ORDER id, so it never
    // matched and every call created another card.)
    if (order.cardId) {
      return errorResponse("This order already has a profile", 409);
    }

    // Generate unique slug
    const slug = generateProfileSlug();

    // Extract customer information
    const customerName = order.user?.name || order.guestName || 'Customer';
    const designation = order.user?.name ? 'Customer' : ''; // Can be enhanced
    const company = '';
    const phone = order.user?.phone || order.guestPhone || '';
    const email = order.user?.email || order.guestEmail || '';
    const website = '';
    const address = '';

    // Build profile data from order items
    const profileData = {
      personalInfo: {
        name: customerName,
        designation,
        company,
        phone,
        email,
      },
      businessInfo: {
        website,
        address,
      },
      orderInfo: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        items: order.items,
        total: order.total,
      },
    };

    // Create card
    const profile = await prisma.card.create({
      data: {
        slug,
        userId: order.userId,
        cardType: "standard",
        status: "ACTIVE",
        isActive: true,
        details: {
          firstName: customerName.split(' ')[0],
          lastName: customerName.split(' ').slice(1).join(' '),
          title: designation,
          company: company,
          phone: phone,
          email: email,
          website: website,
        },
      },
    });

    // Link the card to the order - only if no other request linked one first.
    // Two concurrent calls can both pass the cardId check above; the loser's
    // card is removed so the order ends up with exactly one.
    const linked = await prisma.order.updateMany({
      where: {
        id: order.id,
        OR: [{ cardId: null }, { cardId: { isSet: false } }],
      },
      data: { cardId: profile.id },
    });
    if (linked.count !== 1) {
      await prisma.card.delete({ where: { id: profile.id } }).catch(() => {});
      return errorResponse("This order already has a profile", 409);
    }

    // Send notification email
    if (email) {
      const profileUrl = `${APP_URL}/card/${slug}`;

      const subject = `Your NFC Profile is Ready! - ${order.orderNumber}`;
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your NFC Profile is Ready!</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Your NFC Profile is Ready! 🎉</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Hi ${customerName},
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                Great news! Your NFC profile has been created and is now live. Your profile link is:
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin: 20px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Profile Link</p>
                    <a href="${profileUrl}" style="display: inline-block; padding: 12px 20px; background: #06b6d4; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">${profileUrl}</a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0; color: #374151; font-size: 14px; line-height: 1.6;">
                This link will be programmed into your NFC card. Anyone who taps your card will see your professional profile instantly!
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 14px; line-height: 1.6;">
                Order ID: <strong>${order.orderNumber}</strong><br>
                Total Paid: <strong>$${order.total}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Need help? Contact us at ${SUPPORT_EMAIL}
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
Your NFC Profile is Ready!

Hi ${customerName},

Great news! Your NFC profile has been created and is now live. Your profile link is:
${profileUrl}

This link will be programmed into your NFC card. Anyone who taps your card will see your professional profile instantly!

Order ID: ${order.orderNumber}
Total Paid: $${order.total}

Need help? Contact us at ${SUPPORT_EMAIL}

© ${new Date().getFullYear()} Tapvyo NFC Business Cards
      `;

      sendEmail({
        to: email,
        subject,
        html,
        text,
      }).catch((emailError) => {
        console.error("Profile creation email failed:", emailError);
      });
    }

    return successResponse({
      message: "Profile created successfully",
      profile: {
        id: profile.id,
        slug,
        profileUrl: `${APP_URL}/card/${slug}`,
      },
    }, 201);
  } catch (error) {
    console.error("Create profile error:", error);
    return errorResponse("Failed to create profile", 500);
  }
}

// GET /api/admin/profiles - Get all profiles (admin only)
async function getProfilesHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      prisma.card.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        },
      }),
      prisma.card.count(),
    ]);

    return NextResponse.json({
      profiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get profiles error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 500 }
    );
  }
}

export const POST = withAdmin(createProfileHandler);
export const GET = withAdmin(getProfilesHandler);
