import { getMongoDb } from "../src/lib/mongodb";
import bcrypt from "bcryptjs";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";

if (!process.env.DATABASE_URL?.trim()) {
  throw new Error("Missing environment variable DATABASE_URL");
}

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
    const db = await getMongoDb();
    const admins = db.collection("admins");

    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existing = await admins.findOne({
      email: { $regex: `^${escapedEmail}$`, $options: "i" },
    });

    if (existing) {
      console.log("Admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const now = new Date();
    await admins.insertOne({
      email,
      password: hashedPassword,
      role: "admin",
      name: "Admin User",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log("Admin created successfully");
  } catch (error) {
    console.error("[seedAdmin] Failed:", error);
    process.exitCode = 1;
  }
}

void seedAdmin();
