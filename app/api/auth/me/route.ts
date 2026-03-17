import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authenticate } from "@/lib/auth-middleware";

function isDatabaseConnectivityError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = error as {
    code?: string;
    message?: string;
    name?: string;
  };

  const message = (candidate.message || "").toLowerCase();
  const code = candidate.code || "";
  const name = (candidate.name || "").toLowerCase();

  return (
    code === "P1001" ||
    code === "P1002" ||
    message.includes("database_url") ||
    message.includes("can't reach database server") ||
    message.includes("server selection timeout") ||
    message.includes("authentication failed") ||
    message.includes("connection") ||
    name.includes("prismaclientinitializationerror")
  );
}

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
    if (isDatabaseConnectivityError(error)) {
      console.error("Get current user database connectivity error:", {
        error: error instanceof Error ? error.message : String(error),
        status: 503,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: "Authentication service unavailable. Please try again shortly." },
        { status: 503 }
      );
    }

    console.error("Get current user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
