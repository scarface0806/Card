import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
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
};

type AdminLoginUser = {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN';
  passwordHash: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeRole(role?: string | null): string {
  return role?.trim().toUpperCase() || 'ADMIN';
}

async function findMongoAdminByEmail(email: string): Promise<AdminLoginUser | null> {
  const db = await getMongoDb();
  const admins = db.collection<MongoAdminUser>('admins');
  const admin = await admins.findOne({
    email: {
      $regex: `^${escapeRegex(email)}$`,
      $options: 'i',
    },
  });

  if (!admin || !admin.password || admin.isActive === false) {
    return null;
  }

  if (normalizeRole(admin.role) !== 'ADMIN') {
    return null;
  }

  return {
    id: admin._id.toString(),
    email: admin.email?.trim().toLowerCase() || email,
    name: admin.name?.trim() || 'Admin User',
    role: 'ADMIN',
    passwordHash: admin.password,
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

    const adminEmailConfig = (process.env.ADMIN_EMAIL || process.env.AUTO_CREATE_ADMIN_EMAIL || '').toLowerCase().trim();
    const adminPassConfig = process.env.ADMIN_PASSWORD || process.env.AUTO_CREATE_ADMIN_PASSWORD;

    // 3. PRIORITY 1: Check Database for Admin User
    // Support both Mongo-backed admins and Prisma-backed admins.
    try {
      const mongoAdmin = await findMongoAdminByEmail(normalizedEmail);

      if (mongoAdmin) {
        const isValid = await bcrypt.compare(password, mongoAdmin.passwordHash);

        if (isValid) {
          console.info(`[Admin Auth] Successful Mongo admin login: ${normalizedEmail}`);
          return createAdminSuccessResponse({
            id: mongoAdmin.id,
            email: mongoAdmin.email,
            name: mongoAdmin.name,
            role: mongoAdmin.role,
          });
        }
      }

      const user = await prisma.user.findFirst({
        where: {
          email: normalizedEmail,
          role: 'ADMIN',
          isActive: true,
        },
      });

      if (user && user.password) {
        const isValid = await bcrypt.compare(password, user.password);
        
        if (isValid) {
          console.info(`[Admin Auth] Successful database login: ${normalizedEmail}`);
          return createAuthResponse(generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
          }), {
            id: user.id,
            email: user.email,
            name: user.name || 'Admin User',
            role: user.role,
          });
        }
      }

      // 4. PRIORITY 2: Check Environment-Configured Admin (Emergency Access / First Launch)
      if (adminEmailConfig && normalizedEmail === adminEmailConfig && password === adminPassConfig) {
        console.info(`[Admin Auth] Successful login using environment fallback: ${normalizedEmail}`);
        return createAuthResponse(generateToken({
          userId: 'env-admin-id',
          email: normalizedEmail,
          role: 'ADMIN',
        }), {
          id: 'env-admin-id',
          email: normalizedEmail,
          name: 'System Administrator',
          role: 'ADMIN',
        });
      }
    } catch (dbError) {
      console.error('[Admin Auth] Database access failed:', dbError);
      if (adminEmailConfig && normalizedEmail === adminEmailConfig && password === adminPassConfig) {
        console.info(`[Admin Auth] Database unavailable, using environment fallback: ${normalizedEmail}`);
        return createAuthResponse(generateToken({
          userId: 'env-admin-id',
          email: normalizedEmail,
          role: 'ADMIN',
        }), {
          id: 'env-admin-id',
          email: normalizedEmail,
          name: 'System Administrator',
          role: 'ADMIN',
        });
      }

      return errorResponse("Database service unavailable. Please try again shortly.", 503);
    }

    // 5. Failure Case
    console.warn(`[Admin Auth] Unauthorized login attempt: ${normalizedEmail}`);
    return errorResponse("Invalid email or password", 401);

  } catch (error) {
    console.error('[Admin Auth] Fatal error during login:', error);
    return errorResponse("An internal server error occurred.", 500);
  }
}

/**
 * Utility to construct a standardized auth response with cookies
 */
function createAuthResponse(token: string, userData: any) {
  const response = successResponse({
    message: 'Login successful',
    user: userData,
    token, // Return token in body for client-side storage if needed
    success: true, // Specifically matched for existing client checks
  }, 200);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  };

  // Set the primary cookie used by middleware/authenticate helpers
  response.cookies.set('auth-token', token, cookieOptions);
  
  // Set secondary/legacy cookies for backward compatibility with existing components
  response.cookies.set('admin-token', token, cookieOptions);
  response.cookies.set('token', token, cookieOptions);

  return response;
}
