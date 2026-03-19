import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, generateToken } from "@/lib/auth";
import { Role } from "@prisma/client";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { errorResponse, successResponse } from "@/lib/responses";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const DEV_ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@local.dev';
const DEV_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';

function isDatabaseConnectivityError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    name?: string;
  };

  const message = (candidate.message || "").toLowerCase();
  const code = candidate.code || "";
  const name = (candidate.name || "").toLowerCase();

  return (
    code === "P1001" ||
    code === "P1002" ||
    message.includes("database_url") ||
    message.includes("can't reach database server") ||
    message.includes("server selection timeout") ||
    message.includes("authentication failed") ||
    message.includes("connection") ||
    name.includes("prismaclientinitializationerror")
  );
}

function shouldUseSecureCookie(request: NextRequest): boolean {
  return request.nextUrl.protocol === "https:";
}

export async function POST(request: NextRequest) {
  try {
    const secureCookie = shouldUseSecureCookie(request);

    // ✨ Development mode: Allow mock login for testing
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_MOCK_AUTH === 'true') {
      const body = await request.json();
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse(
          "Invalid email or password format", 
          400,
          { validationErrors: parsed.error.issues }
        );
      }
      const { email, password } = parsed.data;

      // Mock admin user for development
      if (email === DEV_ADMIN_EMAIL && password === DEV_ADMIN_PASSWORD) {
        const token = generateToken({
          userId: 'mock-admin-id',
          email: DEV_ADMIN_EMAIL,
          role: Role.ADMIN,
        });

        const userData = {
          id: 'mock-admin-id',
          email: DEV_ADMIN_EMAIL,
          name: 'Admin User',
          role: Role.ADMIN,
        };

        const response = successResponse({
          message: 'Login successful (dev mode)',
          token,
          user: userData,
        }, 200);

        response.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: secureCookie,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        return response;
      }

      return errorResponse('Invalid credentials (dev mode)', 401);
    }

    const rateCheck = checkRateLimit(request, 10);
    if (!rateCheck.ok) {
      const res = errorResponse("Too many login attempts. Please try again later.", 429);
      if (rateCheck.retryAfter) res.headers.set("Retry-After", String(rateCheck.retryAfter));
      return res;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid request body. Please send valid JSON.", 400);
    }

    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        "Invalid email or password format", 
        400,
        { validationErrors: parsed.error.issues }
      );
    }
    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.warn(`[Auth] Failed login attempt for non-existent email: ${email}`);
      return errorResponse("Invalid email or password", 401);
    }

    // Check if user has a password (might be OAuth user)
    if (!user.password) {
      return errorResponse("Please login using your social account", 401);
    }

    // Check if user is active
    if (!user.isActive) {
      console.warn(`[Auth] Login attempt for deactivated account: ${email}`);
      return errorResponse("Account has been deactivated", 403);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      console.warn(`[Auth] Failed login attempt for user: ${email}`);
      return errorResponse("Invalid email or password", 401);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;

    console.info(`[Auth] User logged in successfully: ${email}`);

    const response = successResponse({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    }, 200);

    // Set HTTP-only cookie for secure storage
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.error("[Auth] Database connectivity error during login:", {
        error: error instanceof Error ? error.message : String(error),
        status: 503,
        timestamp: new Date().toISOString(),
      });
      return errorResponse("Authentication service unavailable. Please try again shortly.", 503);
    }

    console.error("[Auth] Login error:", {
      error: error instanceof Error ? error.message : String(error),
      status: 500,
      timestamp: new Date().toISOString()
    });
    return errorResponse("Internal server error. Please try again later.", 500);
  }
}
