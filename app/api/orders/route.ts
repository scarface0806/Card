import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";
import { errorResponse, successResponse } from "@/lib/responses";
import { createOrderSchema } from "@/lib/validators";
import { OrderStatus, PaymentStatus, Prisma, Role } from "@prisma/client";
import { MongoClient } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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
          // The checkout form address, with NO fallback to the account email.
          // Transactional order mail is sent to this and only this - see
          // src/lib/emails/send-order-email.ts.
          recipientEmail: email || null,
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

      const order = await (async () => {
        try {
          return await prisma.order.create({
            data: guestOrderData,
          });
        } catch (error) {
          if (!isReplicaSetRequiredError(error)) {
            throw error;
          }

          const client = getMongoDb();
          const dbName = "taxiapp"; // Use consistent database name

          try {
            const db = await client;
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
          } catch (mongoError) {
            console.error("MongoDB fallback error:", mongoError);
            throw mongoError;
          }
        }
      })();

      // No email is sent here on purpose. The order is still PENDING and
      // unpaid at this point; the customer's order confirmation is fired from
      // the server-side payment-success path once the payment is verified.
      // See src/lib/payment-adapter.ts and src/lib/emails/send-order-email.ts.

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

    let mongoProduct: Record<string, unknown> | null = null;

    if (!product && ObjectId.isValid(productId)) {
      const db = await getMongoDb();
      mongoProduct = (await db
        .collection("products")
        .findOne({ _id: new ObjectId(productId) })) as Record<string, unknown> | null;
    }

    if (!product && !mongoProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Validate product is active
    const isActive = product ? product.isActive : (mongoProduct?.isActive ?? true);
    if (!isActive) {
      return NextResponse.json(
        { error: "Product is not available for purchase" },
        { status: 400 }
      );
    }

    const productName = product
      ? product.name
      : String(mongoProduct?.name || "Product");

    const resolvedCardType = product
      ? product.cardType || cardType || product.name
      : cardType || productName;

    // Calculate totals using DB prices (SECURITY: never trust client prices)
    const itemPrice = product
      ? product.salePrice || product.price
      : Number(mongoProduct?.price || 0);
    const subtotal = itemPrice * qty;
    const shipping = 0; // Can be calculated based on address
    const tax = 0; // Can be calculated based on address
    const total = subtotal + shipping + tax;

    // Create order item
    const orderItem = {
      productId: product ? product.id : String(mongoProduct?._id || productId),
      productName,
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
        // Checkout-form address only, never the account email. Null here
        // makes the email layer log a failed row rather than guess.
        recipientEmail: email || null,
        designation: designation || null,
        company: company || null,
        website: website || null,
        address: address || null,
        cardType: resolvedCardType,
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

    // No email is sent here on purpose - the order is unpaid at this point.
    // The confirmation is fired from the server-side payment-success path.

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
