import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/responses";
import { createOrderSchema } from "@/lib/validators";
import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";
import { sendEmail } from "@/lib/email";
import { APP_NAME, APP_URL, SUPPORT_EMAIL, SUPPORT_PHONE } from "@/utils/constants";
import { MongoClient } from "mongodb";

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

function toValidObjectIdOrNull(value: string | undefined | null) {
  if (!value) return null;
  return /^[a-fA-F0-9]{24}$/.test(value) ? value : null;
}

function isReplicaSetRequiredError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2031"
  );
}

function getDatabaseNameFromUri(uri: string) {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\//, "").trim();
    return pathname || "tapvyo-nfc";
  } catch {
    return "tapvyo-nfc";
  }
}

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status") as OrderStatus | null;

    const where: Record<string, unknown> = {};
    const isAdmin = user.role === "ADMIN";

    if (!isAdmin) {
      where.userId = user.id;
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get orders error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticate(request);

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e => e.message).join(", "), 400);
    }
    const {
      productId,
      quantity,
      address,
      name,
      email,
      phone,
      designation,
      company,
      website,
      cardType,
      price,
      paymentMethod,
      templateSlug,
      profileData,
    } = parsed.data;

    if (!productId) {
      const submittedPrice = price ?? 0;
      const submittedCardType = cardType || templateSlug || "NFC Digital Card";

        const validUserId = toValidObjectIdOrNull(user?.id);

        const guestOrderData = {
          orderNumber: generateOrderNumber(),
          userId: validUserId,
          guestName: name || null,
          guestEmail: email || user?.email || null,
          guestPhone: phone || null,
          designation: designation || null,
          company: company || null,
          website: website || null,
          address: address || null,
          cardType: submittedCardType,
          price: submittedPrice,
          templateSlug: templateSlug || null,
          profileData: profileData ?? body,
          items: [],
          subtotal: submittedPrice,
          discount: 0,
          shipping: 0,
          tax: 0,
          total: submittedPrice,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: paymentMethod || null,
          paymentId: null,
          shippingAddress: null,
          billingAddress: null,
          notes: company || designation
            ? `Company: ${company || '-'} | Designation: ${designation || '-'}`
            : null,
      } as Prisma.OrderUncheckedCreateInput;

      let order = await (async () => {
        try {
          return await prisma.order.create({
            data: guestOrderData,
          });
        } catch (error) {
          if (!isReplicaSetRequiredError(error)) {
            throw error;
          }

          const databaseUrl = process.env.DATABASE_URL;
          if (!databaseUrl) {
            throw new Error("DATABASE_URL is not configured");
          }

          const client = new MongoClient(databaseUrl);
          const dbName = getDatabaseNameFromUri(databaseUrl);

          try {
            await client.connect();
            const db = client.db(dbName);
            const orders = db.collection("orders");

            const now = new Date();
            const insertResult = await orders.insertOne({
              ...guestOrderData,
              createdAt: now,
              updatedAt: now,
            });

            return {
              id: String(insertResult.insertedId),
              orderNumber: String(guestOrderData.orderNumber),
              total: Number(guestOrderData.total || 0),
              status: guestOrderData.status || OrderStatus.PENDING,
              createdAt: now,
            };
          } finally {
            await client.close();
          }
        }
      })();

      const recipientEmail = email || user?.email;
      if (recipientEmail) {
        const supportEmail = SUPPORT_EMAIL || "support@tapvyo-nfc.com";
        const supportPhone = SUPPORT_PHONE || "+91 9999999999";
        const siteUrl = APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://tapvyo.com";
        const orderLink = `${siteUrl}/order-success?orderId=${encodeURIComponent(order.id)}`;

        sendEmail({
          to: recipientEmail,
          subject: `Order received - ${order.orderNumber}`,
          html: `<p>Hi ${name || "there"},</p><p>Your order for <strong>${submittedCardType}</strong> has been received.</p><p>Order ID: <strong>${order.orderNumber}</strong></p><p>Total: <strong>₹${submittedPrice.toLocaleString()}</strong></p><p>You can track it here: <a href="${orderLink}">${orderLink}</a></p><p>Support: ${supportEmail} | ${supportPhone}</p>`,
          text: `Your order has been received. Order ID: ${order.orderNumber}. Card Type: ${submittedCardType}. Total: ₹${submittedPrice}. Track here: ${orderLink}. Support: ${supportEmail} | ${supportPhone}`,
        }).catch((emailError) => {
          console.error("Guest order confirmation email failed:", emailError);
        });
      }

      return NextResponse.json(
        {
          success: true,
          message: "Order created successfully",
          orderId: order.id,
          order: {
            id: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt,
          },
        },
        { status: 201 }
      );
    }

    if (!user) {
      return errorResponse("Authentication required. Please login.", 401);
    }

    const qty = quantity || 1;

    // Fetch product from database (SECURITY: price comes from DB, not client)
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Validate product is active
    if (!product.isActive) {
      return NextResponse.json(
        { error: "Product is not available for purchase" },
        { status: 400 }
      );
    }

    // Calculate totals using DB prices (SECURITY: never trust client prices)
    const itemPrice = product.salePrice || product.price;
    const subtotal = itemPrice * qty;
    const shipping = 0; // Can be calculated based on address
    const tax = 0; // Can be calculated based on address
    const total = subtotal + shipping + tax;

    // Create order item
    const orderItem = {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      price: itemPrice,
      total: itemPrice * qty,
    };

    // Create order with PENDING status
    // Note: shippingAddress expects an Address object with required fields, so we set it to null for now
    const validUserId = toValidObjectIdOrNull(user.id);

    const productOrderData = {
        orderNumber: generateOrderNumber(),
      userId: validUserId,
        guestName: null,
        guestEmail: user.email || null,
        guestPhone: null,
        designation: designation || null,
        company: company || null,
        website: website || null,
        address: address || null,
        cardType: product.cardType || cardType || product.name,
        price: itemPrice,
        templateSlug: templateSlug || null,
        profileData: profileData ?? null,
        items: [orderItem],
        subtotal,
        discount: 0,
        shipping,
        tax,
        total,
        status: OrderStatus.PENDING, // Default status
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: null,
        paymentId: null,
        shippingAddress: null,
        billingAddress: null,
        notes: address ? `Address: ${address}` : null,
    } as Prisma.OrderUncheckedCreateInput;

    const order = await prisma.order.create({
      data: productOrderData,
    });

    // Send confirmation email (best-effort)
    if (user.email) {
      const supportEmail = SUPPORT_EMAIL || "support@tapvyo-nfc.com";
      const supportPhone = SUPPORT_PHONE || "+91 9999999999";
      const siteUrl = APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://tapvyo.com";
      const orderLink = `${siteUrl}/order-success?orderId=${encodeURIComponent(order.id)}`;

      const subject = `Your order is confirmed - ${order.orderNumber}`;
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width: 600px; margin: 0 auto;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background: linear-gradient(135deg, #06b6d4 0%, #14b8a6 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Thank you for your order!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 40px;">
              <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
                Your order has been received and is now pending. We will notify you when it moves to the next stage.
              </p>
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Order ID</p>
                    <p style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">${order.orderNumber}</p>
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Product</p>
                    <p style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">${product.name}</p>
                    <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Status</p>
                    <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">Pending</p>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 24px; color: #374151; font-size: 14px; line-height: 1.6;">
                Need help? Contact our support team at ${supportEmail} or call ${supportPhone}.
              </p>
              <a href="${orderLink}" style="display: inline-block; padding: 12px 20px; background: #06b6d4; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">View Order</a>
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

      const text = `Thank you for your order!\n\nOrder ID: ${order.orderNumber}\nProduct: ${product.name}\nStatus: Pending\n\nNeed help? ${supportEmail} | ${supportPhone}\n\nView order: ${orderLink}`;

      sendEmail({
        to: user.email,
        subject,
        html,
        text,
      }).catch((emailError) => {
        console.error("Order confirmation email failed:", emailError);
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Order created successfully",
        orderId: order.id,
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          total: order.total,
          status: order.status,
          paymentStatus: order.paymentStatus,
          items: order.items,
          createdAt: order.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
