import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { errorResponse, successResponse } from '@/lib/responses';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateCheck = checkRateLimit(request, 10);
    if (!rateCheck.ok) {
      const res = errorResponse("Too many login attempts. Please try again later.", 429);
      if (rateCheck.retryAfter) res.headers.set("Retry-After", String(rateCheck.retryAfter));
      return res;
    }

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

    // Find admin user
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase(),
        role: 'ADMIN' // Only allow admin users
      },
    });

    if (!user) {
      console.warn(`[Admin Auth] Failed login attempt for non-existent admin email: ${email}`);
      return errorResponse("Invalid email or password", 401);
    }

    // Check if user has a password
    if (!user.password) {
      return errorResponse("Invalid login method", 401);
    }

    // Check if user is active
    if (!user.isActive) {
      console.warn(`[Admin Auth] Login attempt for deactivated admin account: ${email}`);
      return errorResponse("Account has been deactivated", 403);
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password);

    if (!isValidPassword) {
      console.warn(`[Admin Auth] Failed login attempt for admin: ${email}`);
      return errorResponse("Invalid email or password", 401);
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    console.info(`[Admin Auth] Admin logged in successfully: ${email}`);

    const response = successResponse({
      message: "Login successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    }, 200);

    // Set HTTP-only cookie for secure storage
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Admin Auth] Login error:", {
      error: error instanceof Error ? error.message : String(error),
      status: 500,
      timestamp: new Date().toISOString()
    });
    return errorResponse("Internal server error. Please try again later.", 500);
  }
}
