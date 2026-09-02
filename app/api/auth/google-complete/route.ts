import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ObjectId } from "mongodb";
import { Role } from "@prisma/client";

import prisma from "@/lib/prisma";
import { getMongoDb } from "@/lib/mongodb";
import { generateToken } from "@/lib/auth";
import { attachGuestOrders } from "@/lib/guest-orders";
import { isReplicaSetRequiredError } from "@/lib/replica-set";

/**
 * GET /api/auth/google-complete
 *
 * THE BRIDGE BETWEEN NEXT-AUTH AND THIS APP'S OWN SESSION.
 *
 * WHY THIS ROUTE EXISTS
 * Google sign-in goes through next-auth, which issues its own
 * `next-auth.session-token` cookie. Nothing else in this app reads that
 * cookie: `authenticate()` in src/lib/auth-middleware.ts and the route guard
 * in proxy.ts both look only for `auth-token` / `admin-token` / `token`. So a
 * completed Google sign-in produced a next-auth session that the app treated
 * as logged out - /my-orders redirected to /login, /api/my-orders returned
 * 401, and the header still showed "Login". The OAuth flow "worked" and the
 * user was still anonymous.
 *
 * There were two ways to fix that: install a Prisma adapter and convert the
 * whole app to `useSession`, or convert the next-auth session into the app's
 * own session once, here. The second is what this does. It touches no existing
 * auth code, so the admin panel, proxy.ts and every authenticated route keep
 * working exactly as they do for email + password login.
 *
 * WHAT IT DOES
 *  1. Reads the next-auth JWT (server-side, signed with NEXTAUTH_SECRET).
 *  2. Upserts the Prisma User, so the customer actually exists in our database
 *     - next-auth alone creates no row, because there is no adapter.
 *  3. Backfills any guest orders placed with the same email.
 *  4. Issues the app's own httpOnly `auth-token` cookie.
 *  5. Redirects to a validated relative path.
 *
 * SECURITY NOTES
 *  - The next-auth JWT is verified by getToken(); a forged or unsigned cookie
 *    yields null and is refused. The email is never read from a query param.
 *  - Only verified Google emails get this far: the signIn callback in
 *    app/api/auth/[...nextauth]/route.ts rejects an unverified one, so this
 *    route can treat the address as proven and safely link it to an existing
 *    account of the same email.
 *  - A Google login NEVER grants ADMIN. An existing admin keeps their role; a
 *    newly created account is always CUSTOMER.
 *  - The redirect target is validated to be a same-site relative path, so this
 *    route cannot be used as an open redirect.
 */

/** Only same-site relative paths. Anything else falls back to "/". */
function safeRedirectPath(raw: string | null): string {
  if (!raw) return "/";
  // Must start with a single "/" and not "//" (protocol-relative URL) or
  // "/\" - both of which browsers resolve to a different origin.
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/";
  }
  // Never bounce straight back into this route.
  if (raw.startsWith("/api/auth/google-complete")) return "/";
  return raw;
}

function redirectTo(request: NextRequest, path: string): NextResponse {
  return NextResponse.redirect(new URL(path, request.nextUrl.origin));
}

interface UpsertedUser {
  id: string;
  email: string;
  role: Role;
}

/**
 * Find or create the User row for a Google identity.
 *
 * Linking is by email, which is safe here only because the caller has already
 * established that Google verified the address (see the file header).
 */
async function upsertGoogleUser(
  email: string,
  name: string | null,
  avatar: string | null
): Promise<UpsertedUser | "deactivated"> {
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true, isActive: true, name: true, avatar: true },
  });

  if (existing) {
    if (!existing.isActive) return "deactivated";

    // Fill in a missing name or avatar from the Google profile, but never
    // overwrite one the customer already has, and never touch `role`.
    const patch: { name?: string; avatar?: string } = {};
    if (!existing.name && name) patch.name = name;
    if (!existing.avatar && avatar) patch.avatar = avatar;

    if (Object.keys(patch).length > 0) {
      try {
        await prisma.user.update({ where: { id: existing.id }, data: patch });
      } catch (error) {
        if (!isReplicaSetRequiredError(error)) throw error;
        const db = await getMongoDb();
        await db
          .collection("users")
          .updateOne(
            { _id: new ObjectId(existing.id) },
            { $set: { ...patch, updatedAt: new Date() } }
          );
      }
    }

    return { id: existing.id, email: existing.email, role: existing.role };
  }

  // New account. `password` stays null - this identity signs in with Google,
  // and /api/auth/login already refuses a passwordless account with "Please
  // login using your social account". emailVerified is true because Google
  // verified it.
  const data = {
    email,
    password: null,
    name: name || null,
    avatar: avatar || null,
    role: Role.CUSTOMER,
    emailVerified: true,
    isActive: true,
  };

  try {
    const created = await prisma.user.create({
      data,
      select: { id: true, email: true, role: true },
    });
    return created;
  } catch (error) {
    if (!isReplicaSetRequiredError(error)) throw error;

    // Single-node MongoDB fallback, same pattern as registration.
    const db = await getMongoDb();
    const now = new Date();
    const inserted = await db.collection("users").insertOne({
      ...data,
      createdAt: now,
      updatedAt: now,
    });

    return {
      id: String(inserted.insertedId),
      email,
      role: Role.CUSTOMER,
    };
  }
}

export async function GET(request: NextRequest) {
  const next = safeRedirectPath(request.nextUrl.searchParams.get("next"));

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error(
        "[Auth] google-complete reached without NEXTAUTH_SECRET set; cannot verify the next-auth token."
      );
      return redirectTo(request, "/login?error=google_not_configured");
    }

    // Verifies the signature. A missing, forged or expired cookie gives null.
    const token = await getToken({ req: request, secret });

    if (!token) {
      console.warn(
        "[Auth] google-complete: no verified next-auth token on the request"
      );
      return redirectTo(request, "/login?error=google_failed");
    }

    const email =
      typeof token.email === "string" ? token.email.toLowerCase().trim() : null;

    if (!email) {
      console.warn("[Auth] google-complete: next-auth token carried no email");
      return redirectTo(request, "/login?error=google_failed");
    }

    const name = typeof token.name === "string" ? token.name : null;
    const avatar = typeof token.picture === "string" ? token.picture : null;

    const user = await upsertGoogleUser(email, name, avatar);

    if (user === "deactivated") {
      console.warn(`[Auth] Google sign-in for deactivated account: ${email}`);
      return redirectTo(request, "/login?error=account_deactivated");
    }

    // Same treatment a password signup gets, so a guest checkout followed by a
    // Google sign-in still lands the customer on their orders.
    const attached = await attachGuestOrders(user.id, email);

    // The app's own session, in the cookie the rest of the app actually reads.
    const appToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Send someone with existing orders straight there, mirroring /signup.
    const destination = next === "/" && attached > 0 ? "/my-orders" : next;

    const response = redirectTo(request, destination);

    response.cookies.set("auth-token", appToken, {
      httpOnly: true,
      // Match the login route: secure only when actually served over https, so
      // local http development still receives the cookie.
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    console.info(`[Auth] Google sign-in completed for ${email}`);

    return response;
  } catch (error) {
    console.error(
      "[Auth] google-complete failed:",
      error instanceof Error ? error.message : String(error)
    );
    return redirectTo(request, "/login?error=google_failed");
  }
}
