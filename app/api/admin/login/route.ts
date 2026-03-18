import { NextRequest } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { generateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { errorResponse, successResponse } from '@/lib/responses';

type MongoUser = {
  _id: ObjectId;
  email?: string;
  password?: string;
  role?: string;
  name?: string;
  phone?: string | null;
  avatar?: string | null;
  isActive?: boolean;
  emailVerified?: boolean;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeRole(role?: string | null): string {
  return role?.trim().toUpperCase() || 'CUSTOMER';
}

function sanitizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

async function findAdminUserByEmail(email: string): Promise<MongoUser | null> {
  const db = await getMongoDb();
  const users = db.collection<MongoUser>('users');

  const user = await users.findOne({
    email: {
      $regex: `^${escapeRegex(email)}$`,
      $options: 'i',
    },
  });

  if (!user) {
    console.warn(`[Admin Auth] User not found in users collection: ${email}`);
    return null;
  }

  console.info(`[Admin Auth] User found in users collection: ${email}`);
  return user;
}

function createAdminSuccessResponse(user: {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN';
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
    if (!process.env.DATABASE_URL?.trim() || !process.env.JWT_SECRET?.trim()) {
      console.error('[Admin Auth] Missing DATABASE_URL or JWT_SECRET');
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
    const password = typeof body.password === 'string' ? body.password : '';

    if (!normalizedEmail || !password) {
      return errorResponse('Email and password are required.', 400);
    }

    console.info(`[Admin Auth] Login attempt for ${normalizedEmail}`);

    try {
      const user = await findAdminUserByEmail(normalizedEmail);

      if (!user) {
        return errorResponse('Invalid email or password', 401);
      }

      if (!user.password) {
        console.warn(`[Admin Auth] Login rejected: missing password hash for ${normalizedEmail}`);
        return errorResponse('Invalid email or password', 401);
      }

      const normalizedRole = normalizeRole(user.role);
      if (normalizedRole !== 'ADMIN') {
        console.warn(`[Admin Auth] Login rejected: role mismatch for ${normalizedEmail} -> ${normalizedRole}`);
        return errorResponse('Invalid email or password', 401);
      }

      if (user.isActive === false) {
        console.warn(`[Admin Auth] Login rejected: inactive account ${normalizedEmail}`);
        return errorResponse('Account has been deactivated', 403);
      }

      if (user.emailVerified === false) {
        console.warn(`[Admin Auth] Login rejected: unverified email ${normalizedEmail}`);
        return errorResponse('Email is not verified', 403);
      }

      const passwordMatches = await bcrypt.compare(password, user.password);
      console.info(`[Admin Auth] Password comparison result for ${normalizedEmail}: ${passwordMatches}`);

      if (!passwordMatches) {
        return errorResponse('Invalid email or password', 401);
      }

      return createAdminSuccessResponse({
        id: user._id.toString(),
        email: user.email || normalizedEmail,
        name: user.name || 'Admin User',
        role: 'ADMIN',
        phone: user.phone ?? null,
        avatar: user.avatar ?? null,
      });
    } catch (dbError) {
      console.error('[Admin Auth] Database service unavailable during login:', dbError);
      return errorResponse('Database service unavailable. Please try again shortly.', 503);
    }
  } catch (error) {
    console.error('[Admin Auth] Fatal error during login:', error);
    return errorResponse('An internal server error occurred.', 500);
  }
}
function createAuthResponse(token: string, userData: any) {
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
