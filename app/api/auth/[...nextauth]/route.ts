import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { NextRequest, NextResponse } from 'next/server';

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

// Only configure NextAuth when all required env vars are present
const isNextAuthConfigured = !!(googleClientId && googleClientSecret && nextAuthSecret);

export const authOptions: NextAuthOptions = {
  providers: isNextAuthConfigured
    ? [
        GoogleProvider({
          clientId: googleClientId!,
          clientSecret: googleClientSecret!,
        }),
      ]
    : [],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: nextAuthSecret || undefined,
};

// Only create the handler if NextAuth is configured
let handler: ReturnType<typeof NextAuth> | null = null;
if (isNextAuthConfigured) {
  handler = NextAuth(authOptions);
}

// Graceful fallback when NextAuth is not configured
function notConfiguredResponse() {
  return NextResponse.json(
    { error: 'OAuth not configured' },
    { status: 501 }
  );
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  // For /api/auth/session — return empty session instead of error
  const params = await ctx.params;
  const slug = params.nextauth;
  if (slug?.[0] === 'session') {
    if (!isNextAuthConfigured) {
      return NextResponse.json({});
    }
  }

  if (!handler) return notConfiguredResponse();
  return handler(req as any, ctx as any);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ nextauth: string[] }> }) {
  const params = await ctx.params;
  const slug = params.nextauth;

  // Block _log endpoint to prevent noise
  if (slug?.[0] === '_log') {
    return NextResponse.json({ ok: true });
  }

  if (!handler) return notConfiguredResponse();
  return handler(req as any, ctx as any);
}
