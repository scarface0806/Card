import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/responses";
import { Role, OrderStatus, PaymentStatus, CardStatus } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { APP_NAME, APP_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/utils/constants";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Helper to extract ID from URL
function getIdFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1].split("?")[0];
}

function normalizeOrderStatus(status: unknown): OrderStatus | undefined {
  if (typeof status !== "string") {
    return undefined;
  }

  const normalized = status.toUpperCase();
  if (normalized === "ACCEPTED") {
    return OrderStatus.CONFIRMED;
  }
  if (normalized === "REJECTED") {
    return OrderStatus.CANCELLED;
  }
  return Object.values(OrderStatus).includes(normalized as OrderStatus)
    ? (normalized as OrderStatus)
    : undefined;
}

// GET /api/admin/orders/:id - Get single order details (Admin only)
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const id = getIdFromUrl(request.url);

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return errorResponse("Order not found", 404);
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Admin get order error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders/:id - Update order status (Admin only)
export async function PATCH(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const id = getIdFromUrl(request.url);
    const body = await request.json();
    const normalizedStatus = normalizeOrderStatus(body?.status);
    const { paymentStatus, notes } = body;

    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!existingOrder) {
      return errorResponse("Order not found", 404);
    }

    // Validate status if provided
    if (body?.status && !normalizedStatus) {
      return errorResponse(
        `Invalid status. Must be one of: ${[...Object.values(OrderStatus), "ACCEPTED", "REJECTED"].join(", ")}`,
        400
      );
    }

    // Validate payment status if provided
    if (paymentStatus && !Object.values(PaymentStatus).includes(paymentStatus)) {
      return errorResponse(
        `Invalid payment status. Must be one of: ${Object.values(PaymentStatus).join(", ")}`,
        400
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (normalizedStatus) {
      updateData.status = normalizedStatus;
    }

    if (paymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    // Auto-create card when status is updated to CONFIRMED
    let createdCard: { id: string; slug: string } | null = null;
    if (normalizedStatus === OrderStatus.CONFIRMED && !existingOrder.cardId && existingOrder.userId) {
      try {
        // Generate unique slug
        const userIdPrefix = existingOrder.userId.substring(0, 6);
        let slug = `tapvyo-nfc-${userIdPrefix}`;
        let slugSuffix = 0;

        // Check for slug uniqueness
        while (true) {
          const existingCard = await prisma.card.findUnique({
            where: { slug: slugSuffix === 0 ? slug : `${slug}-${slugSuffix}` },
          });

          if (!existingCard) {
            if (slugSuffix > 0) {
              slug = `${slug}-${slugSuffix}`;
            }
            break;
          }
          slugSuffix++;
        }

        // Create Card with empty CardDetail
        const newCard = await prisma.card.create({
          data: {
            slug,
            userId: existingOrder.userId,
            status: CardStatus.ACTIVE,
            details: {
              firstName: existingOrder.user?.name?.split(" ")[0] || null,
              lastName: existingOrder.user?.name?.split(" ").slice(1).join(" ") || null,
              email: existingOrder.user?.email || null,
            },
          },
          select: {
            id: true,
            slug: true,
          },
        });

        createdCard = newCard;

        // Update order with cardId
        updateData.cardId = createdCard.id;
      } catch (cardError) {
        // Don't fail the order update if card creation fails
        // Admin can manually create card later
      }
    }

    // Send NFC link email when order is CONFIRMED (only once)
    if (
      normalizedStatus === OrderStatus.CONFIRMED &&
      !existingOrder.nfcLinkEmailSent
    ) {
      const recipientEmail = existingOrder.user?.email || existingOrder.guestEmail || null;
      const cardSlug = createdCard?.slug || (existingOrder.cardId
        ? (await prisma.card.findUnique({ where: { id: existingOrder.cardId }, select: { slug: true } }))?.slug
        : null);

      if (recipientEmail && cardSlug) {
        const siteUrl = APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://tapvyo.com";
        const cardLink = `${siteUrl}/card/${cardSlug}`;
        const supportEmail = SUPPORT_EMAIL || "support@tapvyo-nfc.com";
        const supportPhone = SUPPORT_PHONE || "+91 9999999999";

        const subject = `Your NFC card is ready - ${existingOrder.orderNumber}`;
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NFC Card Ready</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Congratulations! Your NFC card is ready</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
                Your digital NFC profile is now active. Share your card using the link below:
              </p>
              <p style="margin: 0 0 20px;">
                <a href="${cardLink}" style="color: #06b6d4; font-weight: 600;">${cardLink}</a>
              </p>
              <p style="margin: 0 0 16px; color: #374151; font-size: 14px; line-height: 1.6;">
                How to use:
                <br/>1) Open your card link
                <br/>2) Update your details
                <br/>3) Share via NFC or QR
              </p>
              <p style="margin: 0 0 20px; color: #374151; font-size: 14px; line-height: 1.6;">
                Need help? Contact support at ${supportEmail} or call ${supportPhone}.
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 12px;">Order ID: ${existingOrder.orderNumber}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">Powered by ${APP_NAME || "Tapvyo"}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

        const text = `Congratulations! Your NFC card is ready.\n\nNFC link: ${cardLink}\n\nHow to use:\n1) Open your card link\n2) Update your details\n3) Share via NFC or QR\n\nSupport: ${supportEmail} | ${supportPhone}\nOrder ID: ${existingOrder.orderNumber}`;

        const sent = await sendEmail({
          to: recipientEmail,
          subject,
          html,
          text,
        });

        if (sent) {
          updateData.nfcLinkEmailSent = true;
        }
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Order updated successfully",
      order: updatedOrder,
      ...(createdCard && { 
        card: { 
          id: createdCard.id, 
          slug: createdCard.slug,
          url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/card/${createdCard.slug}` 
        } 
      }),
    });
  } catch (error) {
    console.error("Admin update order error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/orders/:id - Hard delete order (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (!user || user.role !== Role.ADMIN) {
      return errorResponse(error || "Admin access required", 403);
    }

    const id = getIdFromUrl(request.url);

    if (!ObjectId.isValid(id)) {
      return errorResponse("Invalid order id", 400);
    }

    const db = await getMongoDb();
    const result = await db.collection("orders").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return errorResponse("Order not found", 404);
    }

    return NextResponse.json({
      success: true,
      message: "Order deleted",
    });
  } catch (error) {
    console.error("API Error:", error);
    return errorResponse("Failed to delete order", 500);
  }
}
