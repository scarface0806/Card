/**
 * DEPRECATED: Use `npx prisma db seed` instead.
 * 
 * This script is kept for legacy compatibility only.
 * The Prisma seed (prisma/seed.ts) is the authoritative seeding method.
 * 
 * To seed the admin user:
 * 1. Set environment variables:
 *    - ADMIN_EMAIL=your-admin@example.com
 *    - ADMIN_PASSWORD=your-strong-password
 * 
 * 2. Run: npx prisma db seed
 */

const dotenv = require("dotenv") as typeof import("dotenv");
const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
const { getMongoDb } = require("../src/lib/mongodb") as typeof import("../src/lib/mongodb");

dotenv.config({ path: ".env.local" });
dotenv.config();

const BCRYPT_ROUNDS = 12;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

async function seedAdmin(): Promise<void> {
  console.log("⚠️  DEPRECATED: Use 'npx prisma db seed' instead.\n");
  
  try {
    const email = getRequiredEnv("DEFAULT_ADMIN_EMAIL").toLowerCase();
    const password = getRequiredEnv("DEFAULT_ADMIN_PASSWORD");

    if (!process.env.DATABASE_URL?.trim()) {
      throw new Error("Missing environment variable DATABASE_URL");
    }

    // Use the Prisma client for consistency
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();
    const { Role } = require("@prisma/client");

    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log("✅ Admin user already exists");
      await prisma.$disconnect();
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: "Admin",
        role: Role.ADMIN,
        isActive: true,
        emailVerified: true,
      },
    });

    console.log("✅ Admin user created successfully");
    await prisma.$disconnect();
  } catch (error) {
    console.error("[seed:admin] Failed to seed admin:", error);
    process.exitCode = 1;
  }
}

void seedAdmin();
