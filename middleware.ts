import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/profile", "/cards/create"];

// Routes that require admin role
const adminRoutes = ["/admin"];

// Routes that should redirect to dashboard if already logged in
const authRoutes = ["/login", "/signup"];

// JWT payload type
interface JWTPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
}

// Verify JWT token using jose (edge-compatible)
async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || "fallback-secret-change-me"
    );
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ✨ Development mode: skip auth for admin routes
  if (process.env.NODE_ENV === 'development' && pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Get token from cookie or Authorization header
  let token = request.cookies.get("auth-token")?.value;
  
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

  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If accessing protected or admin route without token, redirect to login
  if ((isProtectedRoute || isAdminRoute) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token and check role for admin routes
  if (isAdminRoute && token) {
    const payload = await verifyJWT(token);

    // Invalid or expired token
    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth-token");
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

    // Invalid or expired token - redirect to login
    if (!payload) {
      const response = NextResponse.redirect(new URL("/login", request.url));
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
     * - api routes (they have their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
