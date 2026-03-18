import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth-middleware";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

type MongoAdminUser = {
  _id: ObjectId;
  email?: string;
  phone?: string | null;
  avatar?: string | null;
  password?: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeRole(role?: string | null): string {
  return role?.trim().toUpperCase() || "CUSTOMER";
}

function isEmailVerified(value?: boolean): boolean {
  return value === undefined ? true : value;
}

function isActive(value?: boolean): boolean {
  return value === undefined ? true : value;
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
          email: process.env.ADMIN_EMAIL || 'admin@local.dev',
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

    if (user.id === 'env-admin-id') {
      return NextResponse.json({
        user: {
          id: 'env-admin-id',
          email: user.email,
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

    const db = await getMongoDb();
    const users = db.collection<MongoAdminUser>("users");

    const userById = ObjectId.isValid(user.id)
      ? await users.findOne({ _id: new ObjectId(user.id) })
      : null;

    const userByEmail = userById
      ? null
      : await users.findOne({
          email: {
            $regex: `^${escapeRegex(user.email)}$`,
            $options: "i",
          },
        });

    const dbUser = userById || userByEmail;

    if (!dbUser) {
      console.warn(`[Auth] Current user lookup failed for ${user.email}`);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (dbUser.isActive === false) {
      return NextResponse.json(
        { error: "Account deactivated" },
        { status: 403 }
      );
    }

    if (dbUser.emailVerified === false) {
      return NextResponse.json(
        { error: "Email not verified" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      user: {
        id: dbUser._id.toString(),
        email: dbUser.email || user.email,
        name: dbUser.name || "Admin User",
        phone: dbUser.phone || null,
        avatar: dbUser.avatar || null,
        role: normalizeRole(dbUser.role),
        emailVerified: isEmailVerified(dbUser.emailVerified),
        isActive: isActive(dbUser.isActive),
        createdAt: dbUser.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: dbUser.updatedAt?.toISOString() || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get current user error:", {
      error: error instanceof Error ? error.message : String(error),
      status: 500,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { error: "Authentication service unavailable. Please try again shortly." },
      { status: 503 }
    );
  }
}
