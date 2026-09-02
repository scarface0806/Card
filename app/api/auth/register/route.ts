import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  hashPassword,
  generateToken,
} from "@/lib/auth";
import { Role } from "@prisma/client";

// validation and helpers
import { registerSchema } from "@/lib/validators";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/responses";
import { getMongoDb } from "@/lib/mongodb";
import { attachGuestOrders } from "@/lib/guest-orders";
import { isReplicaSetRequiredError } from "@/lib/replica-set";

export async function POST(request: NextRequest) {
  try {
    // rate limit checks
    const rateCheck = checkRateLimit(request, 20);
    if (!rateCheck.ok) {
      const res = errorResponse("Too many requests", 429);
      if (rateCheck.retryAfter) {
        res.headers.set("Retry-After", String(rateCheck.retryAfter));
      }
      return res;
    }

    const body = await request.json();

    // validate using zod. registerSchema normalises `phone` to bare 10 digits,
    // so everything below compares like with like.
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error.issues.map(e => e.message).join(", "), 400);
    }
    const { email, password, name, phone } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return errorResponse("User with this email already exists", 409);
    }

    // Duplicate mobile check. There is no unique index on User.phone - adding
    // one would fail against the existing rows, which hold unnormalised and
    // null numbers - so this is an application-level check. It is therefore
    // racy under two simultaneous signups with the same number; that is an
    // acceptable trade for not migrating live data, because a duplicate mobile
    // is a support annoyance rather than a security problem.
    const existingPhone = await prisma.user.findFirst({
      where: { phone },
      select: { id: true },
    });

    if (existingPhone) {
      return errorResponse(
        "An account already exists with this mobile number",
        409
      );
    }

    const hashedPassword = await hashPassword(password);
    // ✅ Public registration always creates CUSTOMER role, never ADMIN
    const userRole = Role.CUSTOMER;

    const newUser = {
      email: normalizedEmail,
      password: hashedPassword,
      name: name || null,
      phone: phone || null,
      role: userRole,
    };

    /**
     * Prisma's MongoDB connector wraps `create` in a transaction, which needs
     * a replica set. Production runs on Atlas, so the first path is taken; a
     * single-node local MongoDB rejects it with P2031 and registration fails
     * outright. The raw-driver fallback keeps local development working, the
     * same pattern and for the same reason as order creation - see the note in
     * app/api/orders/route.ts.
     */
    const user = await (async () => {
      try {
        return await prisma.user.create({
          data: newUser,
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            createdAt: true,
          },
        });
      } catch (error) {
        if (!isReplicaSetRequiredError(error)) throw error;

        const db = await getMongoDb();
        const now = new Date();
        const inserted = await db.collection("users").insertOne({
          ...newUser,
          emailVerified: false,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });

        return {
          id: String(inserted.insertedId),
          email: newUser.email,
          name: newUser.name,
          phone: newUser.phone,
          role: newUser.role,
          createdAt: now,
        };
      }
    })();

    // After the account exists, so a failure here cannot orphan the signup.
    const attachedOrders = await attachGuestOrders(user.id, normalizedEmail);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        message: "User registered successfully",
        user,
        token,
        // Lets the signup page send someone straight to /my-orders when there
        // is already something to see there.
        attachedOrders,
      },
      { status: 201 }
    );

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error(
      "[Auth] Registration error:",
      error instanceof Error ? error.message : String(error)
    );
    return errorResponse("Internal server error", 500);
  }
}
