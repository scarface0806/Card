import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { createInterface } from "readline/promises";
import { stdin as input, stdout as output } from "process";

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
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
  let client: MongoClient | null = null;

  try {
    const { email, password } = await promptAdminCredentials();
    client = new MongoClient(databaseUrl as string);
    await client.connect();

    const db = client.db();
    const admins = db.collection("admins");

    const existing = await admins.findOne(
      { email },
      { projection: { _id: 1, email: 1, role: 1 } }
    );

    if (existing) {
      console.log("[seedAdmin] Admin already exists:", {
        id: existing._id.toString(),
        email: existing.email,
        role: existing.role,
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const now = new Date();
    const result = await admins.insertOne({
      email,
      password: hashedPassword,
      role: "admin",
      name: "Admin User",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log("[seedAdmin] Admin created successfully:", {
      id: result.insertedId.toString(),
      email,
      role: "admin",
      createdAt: now,
    });
  } catch (error) {
    console.error("[seedAdmin] Failed:", error);
    process.exitCode = 1;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

void seedAdmin();
