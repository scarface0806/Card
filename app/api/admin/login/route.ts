import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { errorResponse, successResponse } from '@/lib/responses';
import { Role } from '@prisma/client';

function sanitizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function sanitizePassword(password: unknown): string {
  return typeof password === 'string' ? password : '';
}

function isDatabaseConnectivityError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    message?: string;
    name?: string;
    code?: string | number;
  };

  const message = (candidate.message || '').toLowerCase();
  const name = (candidate.name || '').toLowerCase();
  const code = String(candidate.code || '').toLowerCase();

  return (
    message.includes('server selection timeout') ||
    message.includes('failed to connect') ||
    message.includes('authentication failed') ||
    code === 'p1001' ||
    code === 'p1002' ||
    name.includes('prismaclientinitializationerror')
  );
}

function createAdminSuccessResponse(user: {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  avatar?: string | null;
}) {
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return createAuthResponse(token, {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone ?? null,
    avatar: user.avatar ?? null,
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL?.trim()) {
      console.error('[Admin Auth] Missing DATABASE_URL');
      return errorResponse(
        'Authentication service misconfigured. Please check environment variables.',
        500
      );
    }

    if (!process.env.JWT_SECRET?.trim()) {
      console.error('[Admin Auth] Missing JWT_SECRET');
      return errorResponse(
        'Authentication service misconfigured. Please check environment variables.',
        500
      );
    }

    let body: { email?: unknown; password?: unknown } = {};
    try {
      body = await request.json();
    } catch {
      return errorResponse('Invalid request body. Please send valid JSON.', 400);
    }

    const normalizedEmail = sanitizeEmail(body.email);
    const email = normalizedEmail;
    const password = sanitizePassword(body.password);

    if (!normalizedEmail) {
      return errorResponse('Email is required.', 400);
    }

    if (!password) {
      return errorResponse('Password is required.', 400);
    }

    // Use Prisma (not direct MongoDB client) — more reliable connection on serverless
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        isActive: true,
        phone: true,
        avatar: true,
      },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    if (user.isActive === false) {
      return errorResponse('Account has been deactivated', 403);
    }

    if (user.role !== Role.ADMIN) {
      return errorResponse('You are not authorized to access admin portal', 403);
    }

    if (!user.password) {
      return errorResponse('Invalid password', 401);
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return errorResponse('Invalid password', 401);
    }

    return createAdminSuccessResponse({
      id: user.id,
      email: user.email,
      name: user.name || 'Admin User',
      role: Role.ADMIN,
      phone: user.phone ?? null,
      avatar: user.avatar ?? null,
    });
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.error('[Admin Auth] Database connectivity error during login:', error);
      return errorResponse('Database service unavailable. Please try again shortly.', 503);
    }

    console.error('[Admin Auth] Fatal error during login:', error);
    return errorResponse('An internal server error occurred.', 500);
  }
}
interface AuthResponseUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  avatar?: string | null;
}

function createAuthResponse(token: string, userData: AuthResponseUser) {
  const response = successResponse({
    message: 'Login successful',
    user: userData,
    token,
    success: true,
  }, 200);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  };

  response.cookies.set('auth-token', token, cookieOptions);
  response.cookies.set('admin-token', token, cookieOptions);
  response.cookies.set('token', token, cookieOptions);

  return response;
}
