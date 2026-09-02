import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Routes that require authentication.
//
// "/create-card" is the purchase flow. This list previously said
// "/cards/create", which is not a route in this app - the real page is
// app/(frontend)/create-card - so the entire buy flow was reachable while
// logged out even though the intent here was clearly to gate it.
const protectedRoutes = ["/dashboard", "/profile", "/create-card", "/my-orders"];

// Routes that require admin role
const adminRoutes = ["/admin"];

/**
 * API routes that create an order or move money. An anonymous caller gets
 * 401 JSON here rather than a redirect, because these are fetch targets.
 *
 * This is belt-and-braces: each handler ALSO verifies the session itself, so
 * the gate does not depend on the matcher below staying correct.
 *
 * DELIBERATELY ABSENT, do not add:
 *   /api/payment/webhook - Razorpay calls it server-to-server and it
 *     authorises with an X-Razorpay-Signature HMAC. There is no session.
 *   /api/payment/verify  - same, recomputes the HMAC with timingSafeEqual.
 *   /api/track-order     - public order lookup by reference, rate limited.
 * Gating any of those breaks payment confirmation or public tracking.
 */
const protectedApiRoutes = [
  "/api/orders",
  "/api/payment/create-razorpay-order",
  "/api/payment/order",
  "/api/payment/create-upi-qr",
  "/api/payment/check-upi-status",
];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ["/login", "/signup"];

// JWT payload type (matches server auth.ts JWTPayload)
// Using string literals instead of enum for edge runtime compatibility
interface JWTPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  iat?: number;
  exp?: number;
}

// Verify JWT token using jose (edge-compatible)
async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || !jwtSecret.trim()) {
      console.error("[Proxy] Missing JWT_SECRET, rejecting protected auth checks");
      return null;
    }

    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    
    // Type assertion is necessary here since jose returns unknown payload
    const verified = payload as Record<string, unknown>;
    return {
      userId: String(verified.userId || ''),
      email: String(verified.email || ''),
      role: (verified.role as string) as "ADMIN" | "CUSTOMER",
      iat: verified.iat as number | undefined,
      exp: verified.exp as number | undefined,
    };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminLoginRoute = pathname === "/admin/login";

  // Get token from cookie or Authorization header
  let token =
    request.cookies.get("auth-token")?.value ||
    request.cookies.get("admin-token")?.value ||
    request.cookies.get("token")?.value;

  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // Check route types
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isProtectedApiRoute = protectedApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const isAdminProtectedRoute = isAdminRoute && !isAdminLoginRoute;

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // API gate first: these are fetch targets, so they must answer 401 JSON
  // rather than 307 to an HTML page.
  if (isProtectedApiRoute) {
    const payload = token ? await verifyJWT(token) : null;
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "You must be signed in to do this." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // If accessing protected or admin route without token, redirect to login
  if ((isProtectedRoute || isAdminProtectedRoute) && !token) {
    const loginPath = isAdminProtectedRoute ? "/admin/login" : "/login";
    const loginUrl = new URL(loginPath, request.url);
    loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token and check role for admin routes
  if (isAdminProtectedRoute && token) {
    const payload = await verifyJWT(token);

    // Invalid or expired token
    if (!payload) {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("auth-token");
      response.cookies.delete("admin-token");
      return response;
    }

    // Check if user has admin role
    if (payload.role !== "ADMIN") {
      // Redirect non-admin users to unauthorized page or home
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }

  // Verify token for protected routes
  if (isProtectedRoute && token) {
    const payload = await verifyJWT(token);

    // Invalid or expired token - redirect to login, keeping the destination
    // so an expired session does not also lose the page they wanted.
    if (!payload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("auth-token");
      return response;
    }
  }

  // If accessing auth routes with valid token, redirect to dashboard
  if (isAuthRoute && token) {
    const payload = await verifyJWT(token);
    if (payload) {
      // Redirect admins to admin dashboard, customers to regular dashboard
      const redirectUrl = payload.role === "ADMIN" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes EXCEPT the order/payment ones in protectedApiRoutes,
     *   which MUST reach this proxy to be gated at all
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
    "/api/orders/:path*",
    "/api/payment/create-razorpay-order",
    "/api/payment/order",
    "/api/payment/create-upi-qr",
    "/api/payment/check-upi-status",
  ],
};