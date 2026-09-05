import { NextRequest, NextResponse, after } from "next/server";
import prisma from "@/lib/prisma";
import { sendAdminOrderNotification } from "@/lib/emails/adminOrderNotification";
import { authenticate } from "@/lib/auth-middleware";
import { errorResponse } from "@/lib/responses";
import { createOrderSchema } from "@/lib/validators";
import { OrderStatus, PaymentStatus, Prisma, Role } from "@prisma/client";
import { getMongoDb } from "@/lib/mongodb";
import {
  SELECTED_PRODUCT_MESSAGES,
  getPurchasableProduct,
} from "@/lib/products/selected-product";

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
    const isAdmin = user.role === Role.ADMIN;

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

/**
 * POST /api/orders - create an order.
 *
 * PRICING IS SERVER-SIDE, ALWAYS.
 *
 * The request body carries `productId` and the customer's details, and nothing
 * else that affects money. The product row is read here and the name, price,
 * slug and line items all come from it.
 *
 * This route used to accept `price` and `cardType` in the body and write them
 * straight into Order.total / Order.cardType. Because the payment adapter reads
 * its amount from Order.total, that made the charged amount a client-supplied
 * value: a crafted POST could buy a 999 rupee card for 1 rupee. `price` and
 * `cardType` are no longer in createOrderSchema at all, so zod strips them and
 * there is nothing for this handler to read even by accident.
 *
 * The order lands PENDING / unpaid. No email is sent here - the confirmation is
 * fired from the server-side payment-success path once payment is verified.
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await authenticate(request);

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map((e) => e.message).join(", "), 400);
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
      paymentMethod,
      profileData,
    } = parsed.data;

    // A SIGNED-IN CUSTOMER IS NOW REQUIRED TO PLACE AN ORDER.
    //
    // This route used to accept an anonymous caller as long as the checkout
    // form carried name + email + phone (guest checkout). That is no longer
    // allowed: hiding the CTA or gating /create-card in proxy.ts stops a
    // browser, but anyone can POST here directly, so the refusal has to live
    // in the handler as well as the middleware.
    //
    // The guest columns (guestName/guestEmail/guestPhone) and
    // attachGuestOrders() are intentionally LEFT IN PLACE: historical guest
    // orders still need to read back and still get backfilled onto an account
    // at signup. Only NEW anonymous orders are refused.
    if (!user) {
      return errorResponse("You must be signed in to place an order.", 401);
    }

    // Contact details are still required - a signed-in customer can be
    // ordering a card for someone else, so we cannot just read their account.
    const hasContactDetails = Boolean(name && email && phone);
    if (!hasContactDetails) {
      return errorResponse(
        "Your name, email and mobile number are required to place an order.",
        400
      );
    }

    // THE authoritative read. Everything money-related below comes from this.
    const productResult = await getPurchasableProduct(productId);

    if (!productResult.ok) {
      return errorResponse(
        SELECTED_PRODUCT_MESSAGES[productResult.reason],
        productResult.reason === "not-found" ? 404 : 400
      );
    }

    const product = productResult.product;

    const qty = quantity ?? 1;
    const unitPrice = product.price;
    const subtotal = unitPrice * qty;
    const shipping = 0; // Free shipping
    const tax = 0;
    const total = subtotal + shipping + tax;

    const orderItem = {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      price: unitPrice,
      total: subtotal,
    };

    const orderData = {
      orderNumber: generateOrderNumber(),
      userId: toValidObjectIdOrNull(user?.id),
      guestName: name || null,
      guestEmail: email || user?.email || null,
      guestPhone: phone || null,
      // The checkout form address, with NO fallback to the account email.
      // Transactional order mail is sent to this and only this - see
      // src/lib/emails/send-order-email.ts.
      recipientEmail: email || null,
      designation: designation || null,
      company: company || null,
      website: website || null,
      address: address || null,
      // Product identity and price, straight from the product row. Snapshotted
      // rather than joined, so the confirmation email for this order keeps
      // showing what was actually bought even if the product is later renamed,
      // re-priced or given new artwork.
      cardType: product.name,
      price: unitPrice,
      templateSlug: product.slug,
      productTier: product.tierLabel,
      productImageUrl: product.imageUrl,
      profileData: profileData ?? null,
      items: [orderItem],
      subtotal,
      discount: 0,
      shipping,
      tax,
      total,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: paymentMethod || null,
      paymentId: null,
      shippingAddress: null,
      billingAddress: null,
      notes:
        company || designation
          ? `Company: ${company || "-"} | Designation: ${designation || "-"}`
          : null,
    } as Prisma.OrderUncheckedCreateInput;

    // Prisma's MongoDB connector needs a replica set to write. The raw-driver
    // fallback keeps local single-node development working; production runs on
    // Atlas, where the first path is taken.
    const order = await (async () => {
      try {
        return await prisma.order.create({ data: orderData });
      } catch (error) {
        if (!isReplicaSetRequiredError(error)) {
          throw error;
        }

        const db = await getMongoDb();
        const now = new Date();
        const insertResult = await db.collection("orders").insertOne({
          ...orderData,
          createdAt: now,
          updatedAt: now,
        });

        return {
          id: String(insertResult.insertedId),
          orderNumber: String(orderData.orderNumber),
          total: Number(orderData.total || 0),
          status: orderData.status || OrderStatus.PENDING,
          paymentStatus: orderData.paymentStatus || PaymentStatus.PENDING,
          items: [orderItem],
          createdAt: now,
        };
      }
    })();

    // No CUSTOMER email is sent here on purpose. The order is still PENDING and
    // unpaid; the customer's order confirmation is fired from the server-side
    // payment-success path once the payment is verified. See
    // src/lib/payment-adapter.ts and src/lib/emails/send-order-email.ts.
    //
    // The ADMIN alert is different: the business wants to know an order was
    // placed even if the customer never completes payment, because an abandoned
    // checkout is exactly the one worth chasing. Payment-success sends its own
    // alert later, distinguished by the "(unpaid)" subject prefix.
    //
    // after() rather than await: the send runs once the 201 below has already
    // gone to the browser, so checkout is not held up by an email, and unlike a
    // floating promise Vercel keeps the function alive until it finishes.
    // sendAdminOrderNotification never throws on its own; the catch is a second
    // guard so a rejection can never surface as an unhandled rejection.
    after(async () => {
      try {
        await sendAdminOrderNotification(order.id);
      } catch (err) {
        console.error(
          "[admin-notification] order " + order.id + " placement alert threw: " +
            (err instanceof Error ? err.message : String(err))
        );
      }
    });

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
      { success: false, error: "Failed to create order" },
      { status: 500 }
    );
  }
}
