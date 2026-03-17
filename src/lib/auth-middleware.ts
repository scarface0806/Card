import { NextRequest, NextResponse } from "next/server";
import { verifyToken, extractTokenFromHeader, AuthUser, JWTPayload } from "@/lib/auth";
import { Role } from "@prisma/client";

/**
 * Authenticate request and return user info
 * Checks both Authorization header and auth-token cookie
 */
export async function authenticate(
  request: NextRequest
): Promise<{ user: AuthUser | null; error: string | null }> {
  // Try to get token from Authorization header first
  const authHeader = request.headers.get("authorization");
  let token = extractTokenFromHeader(authHeader);

  // If no header token, try to get from cookie
  if (!token) {
    token =
      request.cookies.get("auth-token")?.value ||
      request.cookies.get("admin-token")?.value ||
      request.cookies.get("token")?.value ||
      null;
  }

  if (!token) {
    return { user: null, error: "No token provided" };
  }

  const payload = verifyToken(token);

  if (!payload) {
    return { user: null, error: "Invalid or expired token" };
  }

  return {
    user: {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    },
    error: null,
  };
}

/**
 * Middleware wrapper for protected routes
 */
export function withAuth(
  handler: (request: NextRequest, user: AuthUser, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const { user, error } = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    return handler(request, user, context);
  };
}

/**
 * Middleware wrapper for admin-only routes
 */
export function withAdmin(
  handler: (request: NextRequest, user: AuthUser, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    const { user, error } = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    if (user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "Access denied. Admin privileges required." },
        { status: 403 }
      );
    }

    return handler(request, user, context);
  };
}

/**
 * Check if user has specific role
 */
export function hasRole(user: AuthUser, roles: Role[]): boolean {
  return roles.includes(user.role);
}

/**
 * Get user from request (non-throwing version)
 */
export async function getUserFromRequest(
  request: NextRequest
): Promise<AuthUser | null> {
  const { user } = await authenticate(request);
  return user;
}
