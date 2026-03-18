const dotenv = require("dotenv") as typeof import("dotenv");
const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
const { getMongoDb } = require("../src/lib/mongodb") as typeof import("../src/lib/mongodb");

dotenv.config({ path: ".env.local" });
dotenv.config();

const BCRYPT_ROUNDS = 10;

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

async function seedAdmin(): Promise<void> {
  try {
    const email = getRequiredEnv("DEFAULT_ADMIN_EMAIL").toLowerCase();
    const password = getRequiredEnv("DEFAULT_ADMIN_PASSWORD");

    if (!process.env.DATABASE_URL?.trim()) {
      throw new Error("Missing environment variable DATABASE_URL");
    }

    const db = await getMongoDb();
    const admins = db.collection("admins");

    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const admin = await admins.findOne({
      email: { $regex: `^${escapedEmail}$`, $options: "i" },
    });

    if (admin) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await admins.insertOne({
      email,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(),
    });

    console.log("Admin created successfully");
  } catch (error) {
    console.error("[seed:admin] Failed to seed admin:", error);
    process.exitCode = 1;
  }
}

void seedAdmin();
