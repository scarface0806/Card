import { NextRequest } from 'next/server';
import { getMongoDb } from '@/lib/mongodb';
import { generateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { z } from 'zod';
import { errorResponse, successResponse } from '@/lib/responses';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type MongoAdminUser = {
  _id: ObjectId;
  email?: string;
  password?: string;
  name?: string;
  role?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  phone?: string | null;
  avatar?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type AdminLoginUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN';
  passwordHash: string;
  phone?: string | null;
  avatar?: string | null;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeRole(role?: string | null): string {
  return role?.trim().toUpperCase() || 'ADMIN';
}

async function findAdminUserByEmail(email: string): Promise<AdminLoginUser | null> {
  const db = await getMongoDb();
  const users = db.collection<MongoAdminUser>('users');
  const user = await users.findOne({
    email: {
      $regex: `^${escapeRegex(email)}$`,
      $options: 'i',
    },
  });

  if (!user) {
    console.info(`[Admin Auth] Admin lookup in users collection: not found for ${email}`);
    return null;
  }

  if (!user.password) {
    console.warn(`[Admin Auth] Admin lookup rejected in users collection because password is missing for ${email}`);
    return null;
  }

  if (normalizeRole(user.role) !== 'ADMIN') {
    console.warn(`[Admin Auth] Admin lookup rejected in users collection because role is not ADMIN for ${email}`);
    return null;
  }

  if (user.isActive === false) {
    console.warn(`[Admin Auth] Admin lookup rejected in users collection because account is inactive for ${email}`);
    return null;
  }

  if (user.emailVerified === false) {
    console.warn(`[Admin Auth] Admin lookup rejected in users collection because email is unverified for ${email}`);
    return null;
  }

  console.info(`[Admin Auth] Admin user found in users collection: ${email}`);

  return {
    id: user._id.toString(),
    email: user.email?.trim().toLowerCase() || email,
    name: user.name?.trim() || 'Admin User',
    role: 'ADMIN',
    passwordHash: user.password,
    phone: user.phone || null,
    avatar: user.avatar || null,
  };
}

function createAdminSuccessResponse(user: Omit<AdminLoginUser, 'passwordHash'>) {
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

/**
 * Handle Admin Authentication
 * Support both Database-backed admins and Environment-configured fallback admins
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Environmental Check (Ensure required secrets exist before proceeding)
    if (!process.env.DATABASE_URL?.trim() || !process.env.JWT_SECRET?.trim()) {
      console.error('[Admin Auth] Missing critical environment variables');
      return errorResponse(
        "Authentication service misconfigured. Please check environment variables.",
        500
      );
    }

    // 2. Parse and Validate Request Body
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
    const normalizedEmail = email.toLowerCase().trim();
    console.info(`[Admin Auth] Login attempt received for ${normalizedEmail}`);

    // 3. Authenticate directly against MongoDB users collection.
    try {
      const adminUser = await findAdminUserByEmail(normalizedEmail);

      if (!adminUser) {
        return errorResponse('Invalid email or password', 401);
      }

      const isValid = await bcrypt.compare(password, adminUser.passwordHash);

      if (!isValid) {
        console.warn(`[Admin Auth] Password verification failed for ${normalizedEmail}`);
        return errorResponse('Invalid email or password', 401);
      }

      console.info(`[Admin Auth] Successful admin login: ${normalizedEmail}`);
      return createAdminSuccessResponse({
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        phone: adminUser.phone,
        avatar: adminUser.avatar,
      });
    } catch (dbError) {
      console.error('[Admin Auth] Database access failed:', dbError);
      return errorResponse('Database service unavailable. Please try again shortly.', 503);
    }
  } catch (error) {
    console.error('[Admin Auth] Fatal error during login:', error);
    return errorResponse('An internal server error occurred.', 500);
  }
}

/**
 * Utility to construct a standardized auth response with cookies
 */
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
