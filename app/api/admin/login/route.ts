import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/rate-limit';
import { errorResponse, successResponse } from '@/lib/responses';
import { getMongoDb } from '@/lib/mongodb';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const DEFAULT_ADMIN_EMAIL = process.env.NODE_ENV === 'development' ? 'admin@local.dev' : '';
const DEFAULT_ADMIN_PASSWORD = process.env.NODE_ENV === 'development' ? 'admin123456' : '';
const DEV_ADMIN_EMAIL = process.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
const DEV_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
const PROD_CONFIG_ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();
const PROD_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const PROD_ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

// Auto-create admin credentials from environment (HIGHEST PRIORITY for local & production)
// Support both legacy and current variable names.
const AUTO_CREATE_ADMIN_EMAIL = (
  process.env.DEFAULT_ADMIN_EMAIL ||
  process.env.AUTO_CREATE_ADMIN_EMAIL ||
  ''
).toLowerCase().trim();
const AUTO_CREATE_ADMIN_PASSWORD =
  process.env.DEFAULT_ADMIN_PASSWORD ||
  process.env.AUTO_CREATE_ADMIN_PASSWORD ||
  '';

// Build fallback emails array including auto-create email
const FALLBACK_ADMIN_EMAILS = Array.from(new Set([
  AUTO_CREATE_ADMIN_EMAIL, // HIGHEST PRIORITY
  PROD_CONFIG_ADMIN_EMAIL,
  process.env.NODE_ENV === 'development' ? DEFAULT_ADMIN_EMAIL : undefined,
].filter((email): email is string => Boolean(email))));

/**
 * Automatically create default admin if it doesn't exist
 * This is a safe operation that only creates an admin if:
 * 1. No admin exists with the email
 * 2. Environment variables are properly configured
 * 
 * SENIOR LEVEL: Handles both local dev and production Vercel
 */
async function ensureDefaultAdminExists(loginEmail?: string, loginPassword?: string): Promise<boolean> {
  try {
    // Use provided credentials (from login attempt) or fall back to env vars
    const emailToCreate = loginEmail?.toLowerCase().trim() || AUTO_CREATE_ADMIN_EMAIL?.toLowerCase().trim();
    const passwordToCreate = loginPassword || AUTO_CREATE_ADMIN_PASSWORD;

    if (!emailToCreate || !passwordToCreate) {
      console.debug('[Admin Auto-Create] Skipped: Missing credentials in environment');
      return false;
    }

    const db = await getMongoDb();
    const adminCollection = db.collection('admins');

    // Check if admin already exists (case-insensitive)
    const existingAdmin = await adminCollection.findOne({
      email: { $regex: `^${emailToCreate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    });

    if (existingAdmin) {
      console.debug('[Admin Auto-Create] Admin already exists, skipping creation');
      return true;
    }

    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(passwordToCreate, 10);

    // Create default admin
    const result = await adminCollection.insertOne({
      email: emailToCreate,
      password: hashedPassword,
      role: 'admin',
      name: 'Default Admin',
      isActive: true,
      createdAt: new Date(),
      createdVia: 'auto-create-system',
    });

    console.info('[Admin Auto-Create] Default admin created successfully', {
      id: result.insertedId.toString(),
      email: emailToCreate,
      environment: process.env.NODE_ENV,
    });

    return true;
  } catch (error) {
    console.error('[Admin Auto-Create] Error creating default admin:', {
      error: error instanceof Error ? error.message : String(error),
      environment: process.env.NODE_ENV,
    });
    return false;
  }
}

async function verifyProductionAdminPassword(password: string): Promise<boolean> {
  if (PROD_ADMIN_PASSWORD_HASH) {
    return verifyPassword(password, PROD_ADMIN_PASSWORD_HASH);
  }

  if (PROD_ADMIN_PASSWORD) {
    return password === PROD_ADMIN_PASSWORD;
  }

  return false;
}

async function verifyFallbackPasswordForEmail(email: string, password: string): Promise<boolean> {
  // PRIORITY 1: Check auto-create credentials (highest priority for local & production)
  if (AUTO_CREATE_ADMIN_EMAIL && email.toLowerCase() === AUTO_CREATE_ADMIN_EMAIL && password === AUTO_CREATE_ADMIN_PASSWORD) {
    console.debug('[Admin Auth] Verified with auto-create credentials');
    return true;
  }

  // PRIORITY 2: Check production config credentials
  if (PROD_CONFIG_ADMIN_EMAIL && email === PROD_CONFIG_ADMIN_EMAIL) {
    if (await verifyProductionAdminPassword(password)) {
      console.debug('[Admin Auth] Verified with production credentials');
      return true;
    }
  }

  // PRIORITY 3: Check development defaults
  if (process.env.NODE_ENV === 'development' && email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
    console.debug('[Admin Auth] Verified with dev defaults');
    return true;
  }

  return false;
}

function isDatabaseConnectivityError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    name?: string;
  };

  const message = (candidate.message || '').toLowerCase();
  const code = candidate.code || '';
  const name = (candidate.name || '').toLowerCase();

  return (
    code === 'P1001' ||
    code === 'P1002' ||
    message.includes('database_url') ||
    message.includes('can\'t reach database server') ||
    message.includes('server selection timeout') ||
    message.includes('authentication failed') ||
    message.includes('connection') ||
    name.includes('prismaclientinitializationerror')
  );
}

type MongoAdmin = {
  _id: { toString: () => string };
  email?: string;
  password?: string;
  role?: string;
  name?: string;
  isActive?: boolean;
};

export async function POST(request: NextRequest) {
  try {

    const missingEnvVars: string[] = [];
    if (!process.env.DATABASE_URL?.trim()) missingEnvVars.push('DATABASE_URL');
    if (!process.env.JWT_SECRET?.trim()) missingEnvVars.push('JWT_SECRET');
    if (missingEnvVars.length > 0) {
      console.error('[Admin Auth] Missing env vars:', missingEnvVars.join(', '));
      return errorResponse(
        `Missing required environment variables: ${missingEnvVars.join(', ')}`,
        500,
        { missing: missingEnvVars }
      );
    }

    // Rate limiting check (before parsing body)
    const secureCookie = process.env.NODE_ENV === 'production';

    // Keep strict throttling in production, but avoid local-dev lockouts.
    if (process.env.NODE_ENV === 'production') {
      const rateCheck = checkRateLimit(request, 10);
      if (!rateCheck.ok) {
        const res = errorResponse("Too many login attempts. Please try again later.", 429);
        if (rateCheck.retryAfter) res.headers.set("Retry-After", String(rateCheck.retryAfter));
        return res;
      }
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
    const normalizedEmail = email.toLowerCase().trim();
    const fallbackPassword = password.trim();

    // Auto-create default admin if credentials match auto-create config
    // This is safe and only runs if environment variables are configured
    if (normalizedEmail === AUTO_CREATE_ADMIN_EMAIL && 
        fallbackPassword === AUTO_CREATE_ADMIN_PASSWORD) {
      await ensureDefaultAdminExists(normalizedEmail, fallbackPassword);
    }

    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_MOCK_AUTH === 'true') {
      if (email === DEV_ADMIN_EMAIL && password === DEV_ADMIN_PASSWORD) {
        const token = generateToken({
          userId: 'mock-admin-id',
          email: DEV_ADMIN_EMAIL,
          role: 'ADMIN',
        });

        const response = successResponse({
          message: 'Login successful (dev mode)',
          user: {
            id: 'mock-admin-id',
            email: DEV_ADMIN_EMAIL,
            name: 'Admin User',
            role: 'ADMIN',
          },
          token,
        }, 200);

        response.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        response.cookies.set('admin-token', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        return response;
      }
    }

    // Safe fallback credentials for admin access when DB user is not available.
    if (FALLBACK_ADMIN_EMAILS.includes(normalizedEmail)) {
      const isConfiguredAdminPassword = await verifyFallbackPasswordForEmail(normalizedEmail, fallbackPassword);
      if (isConfiguredAdminPassword) {
        const token = generateToken({
          userId: 'env-admin-id',
          email: normalizedEmail,
          role: 'ADMIN',
        });

        const response = successResponse({
          message: 'Login successful',
          user: {
            id: 'env-admin-id',
            email: normalizedEmail,
            name: 'Admin User',
            role: 'ADMIN',
          },
          token,
        }, 200);

        response.cookies.set('auth-token', token, {
          httpOnly: true,
          secure: secureCookie,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        response.cookies.set('admin-token', token, {
          httpOnly: true,
          secure: secureCookie,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });

        console.info(`[Admin Auth] Production env admin login successful: ${normalizedEmail}`);
        return response;
      }
    }

    // Try Mongo admins collection first for production parity (Atlas/Vercel)
    const db = await getMongoDb();
    const mongoAdmin = (await db.collection('admins').findOne({
      email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    })) as MongoAdmin | null;

    if (mongoAdmin) {
      if (mongoAdmin.isActive === false) {
        return errorResponse('Account has been deactivated', 403);
      }

      const storedHash = String(mongoAdmin.password || '');
      const isValid = storedHash ? await bcrypt.compare(password, storedHash) : false;

      if (!isValid) {
        console.warn(`[Admin Auth] Failed login attempt for Mongo admin: ${email}`);
        return errorResponse('Invalid email or password', 401);
      }

      const token = generateToken({
        userId: mongoAdmin._id.toString(),
        email: normalizedEmail,
        role: 'ADMIN',
      });

      const response = successResponse({
        message: 'Login successful',
        user: {
          id: mongoAdmin._id.toString(),
          email: normalizedEmail,
          name: mongoAdmin.name || 'Admin User',
          role: 'ADMIN',
        },
        token,
      }, 200);

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      response.cookies.set('token', token, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      response.cookies.set('admin-token', token, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      console.info(`[Admin Auth] Mongo admin logged in successfully: ${normalizedEmail}`);
      return response;
    }

    // Fallback to Prisma admin user model
    const user = await prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        role: 'ADMIN', // Only allow admin users
      },
    });

    if (!user) {
      // Safety: Try to auto-create default admin one more time if using default credentials
      if (normalizedEmail === AUTO_CREATE_ADMIN_EMAIL && fallbackPassword === AUTO_CREATE_ADMIN_PASSWORD) {
        console.info('[Admin Auth] Attempting auto-create as fallback for default admin');
        const autoCreateSuccess = await ensureDefaultAdminExists(normalizedEmail, fallbackPassword);
        
        if (autoCreateSuccess) {
          // Try MongoDB lookup after auto-create
          const mongoRetry = (await db.collection('admins').findOne({
            email: { $regex: `^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
          })) as MongoAdmin | null;

          if (mongoRetry && mongoRetry.password) {
            const storedHash = String(mongoRetry.password);
            const isValid = await bcrypt.compare(password, storedHash);

            if (isValid) {
              const token = generateToken({
                userId: mongoRetry._id.toString(),
                email: normalizedEmail,
                role: 'ADMIN',
              });

              const response = successResponse({
                message: 'Login successful (auto-created admin)',
                user: {
                  id: mongoRetry._id.toString(),
                  email: normalizedEmail,
                  name: mongoRetry.name || 'Admin User',
                  role: 'ADMIN',
                },
                token,
              }, 200);

              response.cookies.set('auth-token', token, {
                httpOnly: true,
                secure: secureCookie,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
              });

              response.cookies.set('admin-token', token, {
                httpOnly: true,
                secure: secureCookie,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 7,
                path: '/',
              });

              console.info(`[Admin Auth] Auto-created admin logged in successfully: ${normalizedEmail}`);
              return response;
            }
          }
        }
      }

      console.warn(`[Admin Auth] Failed login attempt for non-existent admin email: ${email}`);
      return NextResponse.json(
        { success: false, message: 'Admin not found' },
        { status: 404 }
      );
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
    const isValidPassword = await bcrypt.compare(password, user.password);

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

    // Keep a single canonical auth cookie for middleware/API auth checks.
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    // Backward-compatible admin cookie for any old client checks.
    response.cookies.set("admin-token", token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    if (isDatabaseConnectivityError(error)) {
      console.error('[Admin Auth] Database connectivity error during login:', {
        error: error instanceof Error ? error.message : String(error),
        status: 503,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { success: false, message: 'Login failed' },
        { status: 500 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    );
  }
}
