import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error("Missing environment variable");
}

const prisma = new PrismaClient();
const BCRYPT_ROUNDS = 12;

async function promptAdminCredentials(): Promise<{ email: string; password: string }> {
  const rl = createInterface({ input, output });

  try {
    const rawEmail = await rl.question("Admin email: ");
    const rawPassword = await rl.question("Admin password: ");

    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword.trim();

    if (!email) {
      throw new Error("Email is required");
    }

    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    return { email, password };
  } finally {
    rl.close();
  }
}

async function seedAdmin() {
  try {
    const { email, password } = await promptAdminCredentials();

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true },
    });

    if (existing) {
      console.log("[seedAdmin] Admin already exists:", {
        id: existing.id,
        email: existing.email,
        role: existing.role,
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
        emailVerified: true,
        name: "Admin",
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log("[seedAdmin] Admin created successfully:", admin);
  } catch (error) {
    console.error("[seedAdmin] Failed:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void seedAdmin();
