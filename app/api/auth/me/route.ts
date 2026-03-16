import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await authenticate(request);

    if (!user) {
      return NextResponse.json(
        { error: error || "Unauthorized" },
        { status: 401 }
      );
    }

    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_MOCK_AUTH === 'true' && user.id === 'mock-admin-id') {
      return NextResponse.json({
        user: {
          id: 'mock-admin-id',
          email: process.env.ADMIN_EMAIL || 'admin@tapvyo.com',
          name: 'Admin User',
          phone: null,
          avatar: null,
          role: 'ADMIN',
          emailVerified: true,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
    }

    // Get fresh user data from database
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
    });

    if (!dbUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (!dbUser.isActive) {
      return NextResponse.json(
        { error: "Account deactivated" },
        { status: 403 }
      );
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
