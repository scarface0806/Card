import { NextRequest } from 'next/server';
import { generateToken } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/responses';
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
    if (!process.env.JWT_SECRET?.trim()) {
      console.error('[Admin Auth] Missing JWT_SECRET');
      return errorResponse(
        'Authentication service misconfigured. Please check environment variables.',
        500
      );
    }

    // TEMPORARY DUMMY LOGIN - REMOVE BEFORE PRODUCTION
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const normalizedEmail =
      typeof body?.email === 'string' && body.email.trim()
        ? body.email.trim().toLowerCase()
        : 'admin@tapvyo.com';

    console.warn(`[Admin Auth] TEMP DUMMY LOGIN used for ${normalizedEmail}`);

    return createAdminSuccessResponse({
      id: 'env-admin-id',
      email: normalizedEmail,
      name: 'Admin User',
      role: 'ADMIN',
      phone: null,
      avatar: null,
    });
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
