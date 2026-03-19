import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth-middleware";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Look up the real user from DB via Prisma (works reliably on serverless)
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    }) ?? await prisma.user.findUnique({
      where: { email: user.email },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!dbUser) {
      console.warn(`[Auth] Current user lookup failed for ${user.email}`);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (dbUser.isActive === false) {
      return NextResponse.json({ error: "Account deactivated" }, { status: 403 });
    }

    return NextResponse.json({
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || "Admin User",
        phone: dbUser.phone || null,
        avatar: dbUser.avatar || null,
        role: dbUser.role,
        emailVerified: dbUser.emailVerified,
        isActive: dbUser.isActive,
        createdAt: dbUser.createdAt.toISOString(),
        updatedAt: dbUser.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get current user error:", error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: "Authentication service unavailable. Please try again shortly." },
      { status: 503 }
    );
  }
}
